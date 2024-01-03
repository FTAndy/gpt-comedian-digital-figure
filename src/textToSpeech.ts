import 'dotenv/config'
import Speaker from 'audio-speaker/stream'
import fetch from 'node-fetch'
import fs from 'fs'

// yk257AxiXBoD8mf3gFLG
export async function generateSpeechContent(text: string, voice_id: string) {
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      "xi-api-key": process.env['XI_API_KEY']
    },
    body: JSON.stringify({
      "model_id": "eleven_multilingual_v2",
      "text": text,
      "voice_settings": {
        "similarity_boost": 1,
        "stability": 0.65,
        "style": 0.5,
        "use_speaker_boost": true
      }
    })
  };
  
  return fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}/stream`, options)
    .then(response => {
      // response.body.pipe(Speaker({

      // }));
      console.log('start')
      return new Promise((resolve) => {
        response.body.pipe(fs.createWriteStream('./test.mp3'))
        response.body.on('end', () => {
          console.log('end')
          resolve(null)
        })
      })
    })
    // .then(response => {
    //   console.log(response)
    //   return response
    // })
    .catch(err => console.error(err));
}

async function test() {
  await generateSpeechContent(
    `Alright, you asked for it. Look, family relationships are a lot like a pack of chocolates. You got your sweet ones, your nuts, some delightful surprises, and at least a couple that should have never left the factory. <break time="2s" /> And just when you feel like you've got a handle on the whole assortment, holidays come around, and you realize the togetherness is kinda like sitting on a pack of M&Ms in August—everybody's a little too close, a little too sticky, and inevitably somebody's gonna leave a stain on the couch. <break time="2s" />`,
    'yk257AxiXBoD8mf3gFLG'
  )
}

test()