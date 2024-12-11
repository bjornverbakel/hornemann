# [Het Hornemannhuis](https://hethornemannhuis.nl/)

## Table of Contents

1. [About](#about)
2. [Installation](#installation)
3. [Features](#features)
4. [Contributing](#contributing)
5. [Authors](#authors)
6. [License](#license)

---

## About

- This project servers to aid and attract customers to Het Hornemannhuis in Eindhoven, The Netherlands. It's ment to let users experrience what Jews had to go through in that time. Through dilemmas it hopes to motivate users to think about their choices, since it directly reflects the consequenses.
- Children tend to enjoy learning through interactivity. So instead of only reading, they can now click through, and lead their own story.

---

## Installation

### Prerequisites

- Node.js, Socket.io, Express, Sqlite3 Ngrok NPM

### Steps

- cd existing_repo
- git remote add origin https://git.fhict.nl/I529052/hornemannhuis-project.git
- git branch -M main
- git push -uf origin main

- INSTALL [NODE](https://nodejs.org/en)
- npm install socket.io@latest socket.io-client@latest express@latest sqlite3@latest
- Host site locally via URL provider [ngrok](https://ngrok.com/):
  choco install ngrok
  ngrok config add-authtoken <token>
  ngrok http 3000
- Running application:
  Terminal: node server/app.js
  go to http://localhost:3000/videoscreen.html to visit the big screen
  Open new terminal: ngrok http 3000
- Paste provided URL in a [QR code generator](https://www.the-qrcode-generator.com/)
- Let people scan the code to join the experience!
- Provided URL and QR code are temporary. And shouldn't be used as permanent links.

- video.js serves as the main JS file
- vote.js handles the visuals and sending of inputs for voting page
- app.js handles server side functioning
- db.js sends data to sqlite3 db. ====== Not updated

## Roadmap

- Adding multiple languages for audience
- Reformatting in a framework
- Adding security features
- Expanding story

## Contributing

11/12/2024 (dd/mm/yyyy) Contribution has stopped.

## Authors

Developers:

- Bjorn Verbakel: https://git.fhict.nl/I529052
- Li-Ming Hillman: https://git.fhict.nl/I503055

Media Production:

- Sergio Vizcarra: https://git.fhict.nl/I508616

## License

### Sounds

Heartbeat Sound Effect by u_9i0vmohuwc from Pixabay

Train tracks Sound Effect by kokoreli777 from Pixabay

Footsteps Sound Effect by freesound_community from Pixabay

Knocking on door Sound Effect by freesound_community from Pixabay

Farm sounds Sound Effect by Justin Callaghan from Pixabay

heavy breathing Sound Effect by freesound_community from Pixabay

Small projector Sound Effect by freesound_community from Pixabay

### Images:

https://beeldbankwo2.nl/nl/

Julia Taubitz on Unsplash (2 images)

https://unsplash.com/photos/an-old-brick-building-with-snow-on-the-ground-S4bZY0u2nz8

https://unsplash.com/photos/a-narrow-street-with-snow-on-the-ground-cwQbP45LTug

[Het Hornemannhuis](https://hethornemannhuis.nl/)
