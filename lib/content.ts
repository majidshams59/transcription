import { siteConfig } from '@/lib/site'

/**
 * The page copy lives here so that the visible HTML and the JSON-LD structured
 * data are generated from the same strings. Google penalises structured data
 * that describes content a user cannot see on the page, so these must not drift.
 *
 * Every statement below is a description of what the code in this repository
 * actually does — do not add claims the app cannot back up.
 */

export const features = [
  {
    title: 'Live captions as you speak',
    body: `Audio from your microphone is streamed to a real-time speech recognition service and turned into ${siteConfig.sourceLanguage} text while you are still talking, instead of after the recording ends.`,
  },
  {
    title: 'Instant translation side by side',
    body: `The same stream is translated to ${siteConfig.targetLanguage} and shown next to the transcript, so both languages stay in view at once.`,
  },
  {
    title: 'Nothing to install',
    body: 'It runs entirely in the browser. There is no app to download, no extension, and no audio file to upload — you grant microphone access and press start.',
  },
  {
    title: 'No recordings kept',
    body: 'Audio is streamed for processing only. This app writes no audio files and stores no transcripts; closing the tab ends the session and the text is gone.',
  },
] as const

export const steps = [
  {
    title: 'Allow microphone access',
    body: 'Press start and your browser asks for permission to use the microphone. The session cannot begin until you allow it.',
  },
  {
    title: 'Speak normally',
    body: 'Your voice is captured in short chunks and sent over a live connection, so the first words appear within moments rather than at the end.',
  },
  {
    title: 'Read both panels',
    body: `The left panel fills with the ${siteConfig.sourceLanguage} transcript and the right panel with the ${siteConfig.targetLanguage} translation. Press stop when you are finished.`,
  },
] as const

export const faqs = [
  {
    question: `What does ${siteConfig.name} do?`,
    answer: `${siteConfig.name} turns speech into live captions in your browser. It listens through your microphone, transcribes ${siteConfig.sourceLanguage} speech into text in real time, and shows a ${siteConfig.targetLanguage} translation of the same speech beside it.`,
  },
  {
    question: 'Do I need to install anything?',
    answer:
      'No. It is a web app — open the page in your browser, allow microphone access, and press start. There is no download, no plugin and no account setup step in the app itself.',
  },
  {
    question: 'Which languages are supported?',
    answer: `Today the app transcribes ${siteConfig.sourceLanguage} and translates it to ${siteConfig.targetLanguage}. Those are the languages the live session is configured with.`,
  },
  {
    question: 'Is my audio recorded or stored?',
    answer:
      'Your audio is streamed to the speech recognition provider so it can be transcribed, and that is all it is used for here. This app itself saves nothing: no audio files are written, no transcripts are stored in a database, and refreshing the page clears what is on screen.',
  },
  {
    question: 'Which browsers work?',
    answer:
      'Any modern browser that can capture microphone audio and record it as WebM/Opus through the MediaRecorder API. If your browser does not support that codec, the session will not start.',
  },
  {
    question: 'How fast do the captions appear?',
    answer:
      'Audio is sent in one-second chunks over a live connection, so text starts appearing while you are still speaking rather than after you finish.',
  },
] as const
