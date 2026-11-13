"""Generate Japanese MP3 narration from the editorial readings.

Install pyopenjtalk-plus==0.4.1.post10 and FFmpeg before running this script.
The resulting files are served directly and require no synthesis API.
"""

import hashlib
import json
import re
import subprocess
import unicodedata
from pathlib import Path

import numpy as np
import pyopenjtalk


ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / 'content'
ASSETS = ROOT / 'dist' / 'assets'
READINGS = ASSETS / 'readings'
SYNTHESIS_VERSION = 'openjtalk-mei-0.4.1.post10-32k-v1'


def load(name, fallback):
    path = CONTENT / f'{name}.json'
    return json.loads(path.read_text(encoding='utf-8')) if path.is_file() else fallback


def spoken(*parts):
    return '。'.join(part.strip().rstrip('。') for part in parts if part and part.strip()) + '。'


def scripts():
    editorial = load('editorial', {})
    for guide in editorial.get('guides', []):
        sections = [spoken(section['reading'], section['textReading']) for section in guide['sections']]
        yield f"guide-{guide['id']}", spoken(guide['reading'], guide.get('summaryReading'), *sections)
    for term in editorial.get('terms', []):
        yield f"term-{term['id']}", spoken(term['reading'], term['definitionReading'])
    for machine in load('machines', []):
        yield f"machine-{machine['id']}", spoken(
            machine['reading'], machine['summaryReading'], machine.get('specsReading'),
        )
    for item in load('readings', []):
        yield item['id'], item['reading']


def synthesize(script, destination):
    rate = 48000
    sentences = re.findall(r'[^。！？\n]+[。！？]?', script)
    samples = []
    for sentence in sentences:
        audio, sample_rate = pyopenjtalk.tts(sentence.strip(), speed=1.02)
        if sample_rate != rate:
            raise ValueError(f'Unexpected sample rate {sample_rate}')
        samples.append(audio)
    signal = np.concatenate(samples)
    pcm = np.clip(signal * 0.85, -32768, 32767).astype('<i2').tobytes()
    staged = destination.with_suffix('.tmp')
    subprocess.run(
        [
            'ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-f', 's16le',
            '-ar', str(rate), '-ac', '1', '-i', 'pipe:0', '-ar', '24000',
            '-codec:a', 'libmp3lame', '-b:a', '32k', '-f', 'mp3', str(staged),
        ],
        input=pcm,
        check=True,
    )
    staged.replace(destination)


def main():
    READINGS.mkdir(parents=True, exist_ok=True)
    clips = {}
    for key, script in scripts():
        if not re.fullmatch(r'[a-z0-9-]+', key) or key in clips:
            raise ValueError(f'Invalid or duplicate reading key {key!r}')
        script = unicodedata.normalize('NFC', script).strip()
        if not re.search(r'[ぁ-ゖァ-ヺ]', script):
            raise ValueError(f'{key} has no Japanese phonetic script')
        unconverted = sorted(set(re.findall(r'[A-Za-z0-9Ａ-Ｚａ-ｚ０-９一-龯々]', script)))
        if unconverted:
            print(f'{key} contains characters outside kana: {"".join(unconverted)}', flush=True)
        fingerprint = hashlib.sha256((SYNTHESIS_VERSION + script).encode()).hexdigest()[:10]
        filename = f'{key}-{fingerprint}.mp3'
        destination = READINGS / filename
        if not destination.is_file():
            synthesize(script, destination)
        clips[key] = filename

    manifest = ASSETS / 'reading-clips.js'
    staged = manifest.with_suffix('.tmp')
    staged.write_text(f'export const readingClips = {json.dumps(clips, indent=2, sort_keys=True)};\n', encoding='utf-8')
    staged.replace(manifest)
    current_files = set(clips.values())
    for clip in READINGS.glob('*.mp3'):
        if clip.name not in current_files:
            clip.unlink()
    total = sum((READINGS / filename).stat().st_size for filename in current_files)
    print(f'{len(clips)} readings, {total:,} bytes')


if __name__ == '__main__':
    main()
