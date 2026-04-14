import 'dotenv/config'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'


console.log('ENDPOINT:', process.env.R2_ENDPOINT)
console.log('BUCKET:', process.env.R2_BUCKET)
console.log('ACCESS KEY length:', (process.env.R2_ACCESS_KEY_ID || '').length)
console.log(
  'SECRET KEY length:',
  (process.env.R2_SECRET_ACCESS_KEY || '').length
)
console.log('PUBLIC URL:', process.env.R2_PUBLIC_URL)


const client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

async function test() {
  const url =
    'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Example.jpg/320px-Example.jpg'

  console.log('Downloading test image...')

  const res = await fetch(url)
  const bytes = Buffer.from(await res.arrayBuffer())

  const key = `test/example.jpg`

  console.log('Uploading to R2...')

  await client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      Body: bytes,
      ContentType: 'image/jpeg',
    })
  )

  const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`

  console.log('SUCCESS')
  console.log(publicUrl)
}

test()
