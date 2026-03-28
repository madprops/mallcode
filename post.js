#!/usr/bin/env node

import fs from "fs"
import { AtpAgent } from "@atproto/api"

async function post_to_bluesky(username, zone, value) {
  if (!username || !zone || !value) {
    return
  }

  let creds_path = `creds.json`

  if (!fs.existsSync(creds_path)) {
    console.log(`Credentials file not found.`)
    return
  }

  let creds_file = fs.readFileSync(creds_path, `utf-8`)
  let creds = JSON.parse(creds_file)

  if (!creds.bluesky_password) {
    return
  }

  let agent = new AtpAgent({service: `https://bsky.social`})

  await agent.login({
    identifier: creds.bluesky_handle,
    password: creds.bluesky_password,
  })

  let post_content = `${username} said ${value} in ${zone}`

  console.log(`Posting to Bluesky: ${post_content}`)

  let response = await agent.post({
    text: post_content,
    createdAt: new Date().toISOString()
  })

  console.log(`Post URI: ${response.uri}`)
}

let input_username = process.argv[2]
let input_zone = process.argv[3]
let input_value = process.argv[4]

if (input_username && input_zone && input_value) {
  post_to_bluesky(input_username, input_zone, input_value)
}