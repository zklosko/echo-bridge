# Echo Bridge

EchoBridge is a drop-in software replacement for ETC Echo's UDP control interface for local plugin development and testing without access to a live device. The software package includes a dashboard showing a live overview of all zones in each space with intensity fades in real time, which preset is active per space, and a full RX/TX log between plugins and the mock server.

This project is still under active development. The following features have not been implemented yet:

- Cleaning/consistency across the UI

## Getting Started

### NPM

Install globally using `npm i -g @zklosko/echo-bridge`, then run with `echo-bridge`. Requires Node 22+.

### From source

Clone the repo and run the following in a Node 22+ enviornment.

```bash
npm ci
npm run start
```
