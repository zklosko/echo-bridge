# Echo Bridge

EchoBridge is a drop-in software replacement for ETC Echo's UDP control interface for local plugin development and testing without access to a live device. The software package includes a dashboard showing a live overview of all zones in each space with intensity fades in real time, which preset is active per space, and a full RX/TX log between plugins and the mock server.

This project is still under active development. The following features have not been implemented yet:

- Ability to collapse space sync replies in the request log
- Cleaning/consistency across the UI
- Built-in updates
- Builds for Mac

## Getting Started

### Windows installer

Head to [releases](https://github.com/zklosko/echo-bridge/releases) to download the latest installer.

### From source

Clone the repo and run the following in a Node 22+ enviornment.

```bash
npm ci
npm run dev
```
