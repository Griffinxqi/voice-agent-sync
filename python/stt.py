import assemblyai as aai

aai.settings.api_key = "a824ee4695ff425f9209963393f33681"

# audio_file = "./local_file.mp3"
audio_file = "https://assembly.ai/wildfires.mp3"

# Uses universal-3-pro for en, es, de, fr, it, pt. Else uses universal-2 for support across all other languages
config = aai.TranscriptionConfig(speech_models=["universal-3-pro", "universal-2"], language_detection=True)

transcript = aai.Transcriber(config=config).transcribe(audio_file)

if transcript.status == "error":
  raise RuntimeError(f"Transcription failed: {transcript.error}")

print(transcript.text)