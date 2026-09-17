'use client'

import { TranscriptPanel } from '@/components/transcript-panel'
import { Button } from '@/components/ui/button'
import { useRef, useState } from 'react'
import { RealtimeSession } from 'speechmatics'

/**
 * The interactive part of the home page.
 *
 * This is the only client component on the route: keeping it separate lets
 * app/page.tsx stay a server component, so the marketing copy, headings and
 * FAQ are present in the initial HTML that crawlers read.
 *
 * The session logic below is unchanged from the original implementation.
 */
export function LiveCaptions() {
  const [session, setSession] = useState<RealtimeSession | null>(null)
  const [transcription, setTranscription] = useState<string | null>(null)
  const tcRef = useRef(transcription)
  const [translation, setTranslation] = useState<string | null>(null)
  const tlRef = useRef(translation)

  const listDevices = () => {
    console.log('clicked')
    if (!navigator.mediaDevices?.enumerateDevices) {
      console.log('enumerateDevices() not supported.')
    } else {
      // List microphones.
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        devices = devices.filter((d) => d.kind === 'audioinput')
        console.log(devices)
      })
    }
  }

  const stopTranscript = () => session?.stop()

  const startTranscript = async () => {
    let s: RealtimeSession
    // create a session with JWT
    if (!session) {
      // fetch key
      const { key_value } = await fetch('/api/key').then((res) => res.json())
      s = new RealtimeSession({ apiKey: key_value })
      setSession(s)
    } else {
      s = session
    }

    //add listeners
    s.addListener('RecognitionStarted', () => {
      console.log('RecognitionStarted')
    })

    s.addListener('Error', (error) => {
      console.log('session error', error)
    })

    s.addListener('AddTranscript', (message) => {
      console.log('AddTranscript', message)
      const updatedT = `${tcRef.current ?? ''} ${message.metadata.transcript}`
      setTranscription(updatedT)
    })

    s.addListener('AddTranslation', (message) => {
      console.log('AddTranslation', message)
      const updatedT = `${tlRef.current ?? ''} ${message.results.map(
        (res) => res.content ?? ''
      )}`
      setTranslation(updatedT)
    })

    s.addListener('AddPartialTranscript', (message) => {
      console.log('AddPartialTranscript', message)
    })

    s.addListener('EndOfTranscript', () => {
      console.log('EndOfTranscript')
    })

    //start session which is an async method
    s.start({
      transcription_config: { language: 'en', output_locale: 'en-GB' },
      translation_config: { target_languages: ['cmn'] },
    }).then(async () => {
      //setup audio stream
      // TODO pull out into state
      let stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 16000,
      })

      mediaRecorder.start(1000)

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          s.sendAudio(event.data)
        }
      }
    })
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button onClick={startTranscript} size="lg">
          Start live captions
        </Button>
        <Button onClick={stopTranscript} size="lg" variant="outline">
          Stop
        </Button>
        <Button onClick={listDevices} size="lg" variant="ghost">
          Select microphone
        </Button>
      </div>
      <TranscriptPanel
        transcription={transcription}
        translation={translation}
      />
    </div>
  )
}
