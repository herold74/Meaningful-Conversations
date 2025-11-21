# Manual TTS Voice Model Download Instructions

Due to Hugging Face's Git LFS requirements, voice models need to be downloaded manually.

## Option 1: Direct Download from Hugging Face (Recommended)

Visit the Piper Voices repository and download models directly:

**https://huggingface.co/rhasspy/piper-voices/tree/v1.0.0**

### Required Models:

1. **German Female (Sophia/MLS)**
   - Navigate to: `de_DE/mls/medium/`
   - Download: `de_DE-mls-medium.onnx` (~74MB)
   - Download: `de_DE-mls-medium.onnx.json` (~1KB)

2. **German Male (Thorsten)**
   - Navigate to: `de_DE/thorsten/medium/`
   - Download: `de_DE-thorsten-medium.onnx` (~63MB)
   - Download: `de_DE-thorsten-medium.onnx.json` (~1KB)

3. **English Female (Amy)**
   - Navigate to: `en_US/amy/medium/`
   - Download: `en_US-amy-medium.onnx` (~63MB)
   - Download: `en_US-amy-medium.onnx.json` (~1KB)

4. **English Male (Ryan)**
   - Navigate to: `en_US/ryan/medium/`
   - Download: `en_US-ryan-medium.onnx` (~63MB)
   - Download: `en_US-ryan-medium.onnx.json` (~1KB)

### Installation:

Place all downloaded files in:
```
meaningful-conversations-backend/tts-voices/
```

Expected structure:
```
tts-voices/
├── de_DE-mls-medium.onnx
├── de_DE-mls-medium.onnx.json
├── de_DE-thorsten-medium.onnx
├── de_DE-thorsten-medium.onnx.json
├── en_US-amy-medium.onnx
├── en_US-amy-medium.onnx.json
├── en_US-ryan-medium.onnx
└── en_US-ryan-medium.onnx.json
```

Total size: ~260 MB

## Option 2: Using Git LFS

If you have Git LFS installed:

```bash
cd meaningful-conversations-backend
git clone https://huggingface.co/rhasspy/piper-voices temp-voices
cd temp-voices
git lfs pull

# Copy required models
cp de_DE/mls/medium/de_DE-mls-medium.* ../tts-voices/
cp de_DE/thorsten/medium/de_DE-thorsten-medium.* ../tts-voices/
cp en_US/amy/medium/en_US-amy-medium.* ../tts-voices/
cp en_US/ryan/medium/en_US-ryan-medium.* ../tts-voices/

cd ..
rm -rf temp-voices
```

## Verification

Check that files are the correct size:

```bash
ls -lh tts-voices/*.onnx
```

Expected output (approximate):
```
-rw-r--r--  1 user  staff    74M  de_DE-mls-medium.onnx
-rw-r--r--  1 user  staff    63M  de_DE-thorsten-medium.onnx
-rw-r--r--  1 user  staff    63M  en_US-amy-medium.onnx
-rw-r--r--  1 user  staff    63M  en_US-ryan-medium.onnx
```

If files are only a few bytes (15B), they are Git LFS pointer files and need to be downloaded properly.

## Next Steps

After downloading the models, proceed with:

1. Build TTS container
2. Copy models to Docker volume
3. Start services

See `TTS-SETUP-GUIDE.md` for detailed instructions.

