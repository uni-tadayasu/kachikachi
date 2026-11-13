import { readingClips } from './reading-clips.js';

const preferenceKey = 'zettai-audio-preferences';
const musicSource = new URL('./hear-your-voice.mp3', import.meta.url).href;

function bounded(value, minimum, maximum, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(maximum, Math.max(minimum, number)) : fallback;
}

function loadPreferences() {
  try {
    return JSON.parse(localStorage.getItem(preferenceKey)) || {};
  } catch {
    return {};
  }
}

export function createAudioController({ onState = () => {} } = {}) {
  const preferences = loadPreferences();
  const music = new Audio();
  const narration = new Audio();
  music.loop = true;
  music.preload = 'none';
  narration.preload = 'none';
  narration.preservesPitch = true;
  const speech = window.speechSynthesis;
  const canSpeak = !!speech && typeof window.SpeechSynthesisUtterance === 'function';
  const canRead = canSpeak || Object.keys(readingClips).length > 0;
  let rate = bounded(preferences.rate ?? 1, 0.7, 1.5, 1);
  let musicVolume = bounded(preferences.musicVolume ?? 0.25, 0, 1, 0.25);
  let musicRequested = false;
  let musicAttempt = 0;
  let reading = null;
  let message = '';
  let context;
  let musicGain;

  function emit(nextMessage = message) {
    message = nextMessage;
    onState({
      music: musicRequested,
      reading: !!reading,
      readingId: reading?.item.id ?? null,
      rate,
      musicVolume,
      message,
      canRead,
    });
  }

  function savePreferences() {
    try {
      localStorage.setItem(preferenceKey, JSON.stringify({ rate, musicVolume }));
    } catch {
      // Audio remains usable when storage is unavailable.
    }
  }

  function applyMix() {
    const level = musicVolume * (reading ? 0.32 : 1);
    if (musicGain) {
      musicGain.gain.setTargetAtTime(level, context.currentTime, 0.05);
    } else {
      music.volume = level;
      music.muted = level === 0;
    }
  }

  function prepareOutput() {
    const session = navigator.audioSession;
    if (session) {
      try {
        session.type = 'playback';
      } catch {
        // The browser chooses the default audio route.
      }
    }
    const ios = /iPhone|iPod|iPad/.test(navigator.userAgent)
      || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
    const Context = window.AudioContext || window.webkitAudioContext;
    // Older iOS versions can mute Web Audio with the silent switch. Use media elements there.
    if (!context && Context && (!ios || session)) {
      try {
        context = new Context();
        musicGain = context.createGain();
        musicGain.connect(context.destination);
        context.createMediaElementSource(music).connect(musicGain);
      } catch {
        musicGain = null;
      }
    }
    if (context && context.state !== 'running') context.resume().catch(() => {});
    applyMix();
  }

  function toggleMusic() {
    const attempt = ++musicAttempt;
    if (musicRequested) {
      musicRequested = false;
      music.pause();
      emit('BGMを停止しました。');
      return;
    }
    prepareOutput();
    if (!music.getAttribute('src')) music.src = musicSource;
    musicRequested = true;
    emit('BGMを読み込んでいます。');
    music.play().then(() => {
      if (musicAttempt === attempt && musicRequested) emit('BGMを再生中です。');
    }).catch((error) => {
      if (musicAttempt !== attempt) return;
      musicRequested = false;
      emit(error.name === 'NotAllowedError'
        ? 'BGMボタンをタップして再生してください。'
        : 'BGMを読み込めませんでした。もう一度お試しください。');
    });
  }

  music.addEventListener('pause', () => {
    if (!musicRequested || !music.paused) return;
    musicRequested = false;
    emit('BGMが一時停止しました。');
  });

  function setMusicVolume(value) {
    musicVolume = bounded(value, 0, 1, musicVolume);
    applyMix();
    savePreferences();
    emit();
  }

  function endReading(nextMessage) {
    if (!reading) return;
    const previous = reading;
    reading = null;
    previous.events?.abort();
    if (previous.mode === 'clip') {
      narration.pause();
    } else if (previous.mode === 'speech') {
      speech.cancel();
    }
    applyMix();
    if (nextMessage) emit(nextMessage);
  }

  function speakSegment(active) {
    if (reading !== active || active.mode !== 'speech') return;
    const text = active.segments[active.segment];
    if (!text) {
      endReading('読み上げが終わりました。');
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = speech.getVoices().filter((voice) => /^ja(?:[-_]|$)/i.test(voice.lang));
    const voice = voices.find((entry) => entry.localService && entry.default)
      || voices.find((entry) => entry.localService) || voices[0];
    if (voice) utterance.voice = voice;
    utterance.lang = 'ja-JP';
    utterance.rate = rate;
    active.utterance = utterance;
    const isCurrent = () => reading === active && active.utterance === utterance;
    utterance.onstart = () => {
      if (isCurrent()) emit('端末の日本語音声で読み上げ中です。');
    };
    utterance.onend = () => {
      if (!isCurrent()) return;
      active.segment += 1;
      speakSegment(active);
    };
    utterance.onerror = () => {
      if (isCurrent()) endReading('読み上げられませんでした。端末の日本語音声設定をご確認ください。');
    };
    try {
      speech.speak(utterance);
    } catch {
      endReading('端末の日本語音声を利用できませんでした。');
    }
  }

  function speak(active) {
    const script = (active.item.reading || active.item.text || '').trim();
    if (!canSpeak || !script) {
      endReading('この項目の読み上げ音声を利用できません。');
      return;
    }
    active.mode = 'speech';
    active.segments = script.match(/[^。！？\n]+[。！？]?/gu)?.map((part) => part.trim()).filter(Boolean) || [];
    active.segment = 0;
    speakSegment(active);
  }

  function playClip(active, clip) {
    active.mode = 'clip';
    active.events = new AbortController();
    const options = { signal: active.events.signal };
    function failed(error) {
      if (reading !== active || active.mode !== 'clip') return;
      if (error?.name === 'NotAllowedError') {
        endReading('読み上げボタンをタップして再生してください。');
        return;
      }
      active.events.abort();
      narration.pause();
      speak(active);
    }
    narration.addEventListener('ended', () => {
      if (reading === active && narration.ended) endReading('読み上げが終わりました。');
    }, options);
    narration.addEventListener('error', () => {
      if (narration.error) failed();
    }, options);
    narration.addEventListener('pause', () => {
      if (narration.paused && !narration.ended && reading === active && active.started) {
        endReading('読み上げが一時停止しました。');
      }
    }, options);
    narration.defaultPlaybackRate = rate;
    narration.src = new URL(`./readings/${clip}`, import.meta.url).href;
    narration.playbackRate = rate;
    narration.play().then(() => {
      if (reading !== active || active.mode !== 'clip') return;
      active.started = true;
      emit('読み上げ中です。');
    }).catch(failed);
  }

  function toggleReading(item) {
    if (reading?.item.id === item.id) {
      endReading('読み上げを停止しました。');
      return;
    }
    endReading();
    reading = { item, mode: '' };
    prepareOutput();
    emit('読み上げ音声を準備しています。');
    const clip = Object.prototype.hasOwnProperty.call(readingClips, item.id) ? readingClips[item.id] : null;
    if (clip) playClip(reading, clip);
    else speak(reading);
  }

  function setRate(value) {
    const nextRate = bounded(value, 0.7, 1.5, rate);
    if (nextRate === rate) return;
    rate = nextRate;
    narration.defaultPlaybackRate = rate;
    narration.playbackRate = rate;
    if (reading?.mode === 'speech') {
      reading.utterance = null;
      speech.cancel();
      speakSegment(reading);
    }
    savePreferences();
    emit();
  }

  emit();
  return {
    toggleMusic,
    setMusicVolume,
    toggleReading,
    stopReading: () => endReading('読み上げを停止しました。'),
    setRate,
  };
}
