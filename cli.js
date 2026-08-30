import readline from 'node:readline'
import { EchoServer } from './src/server.js'
import { getSettings, setPort, setEOM, getSubscribers, setSubscribers } from './src/store.js'

const { port, eom } = getSettings()
const host = new EchoServer({ listenPort: port, eom, subscribers: getSubscribers() })

host.on('log', (entry) => {
    console.log(`[${entry.direction}] ${entry.address}:${entry.port} ${entry.raw}`)
})

host.on('statusChange', (spaceId, space) => {
    console.log(`space ${spaceId} changed:`, space)
})

console.log(`echo host listening on ${host.port}, eom=${JSON.stringify(host.eom)}`)

const r1 = readline.createInterface({ input: process.stdin, prompt: '> '})
r1.prompt()

r1.on('line', async (line) => {
    const [cmd, ...args] = line.trim().split(/\s+/)
    switch (cmd) {
        case 'port':
            await host.updatePort(Number(args[0]))  // performs server restart
            setPort(host.port)
            console.log(`port -> ${host.port}`)
            break
        case 'eom':
            host.eom = args[0]
            setEOM(host.eom)
            console.log(`eom -> ${JSON.stringify(host.eom)}`)
            break
        case 'sub':
            handleSub(args)
            break
        case 'space':
            console.log(host.state.getSpace(args[0]))
            break
        default:
            console.log(`unknown command: ${cmd}`)
    }
    r1.prompt()
})

function handleSub([action, address, portArg]) {
    switch(action) {
        case 'add':
            host.addSubscriber(address, Number(portArg))
        case 'remove':
            host.removeSubscriber(address, Number(portArg))
        case 'list':
            return console.log(host.listSubscribers())
        default:
            break
    }
    setSubscribers(host.listSubscribers())
}

process.on('SIGINT', () => {
    host.close()
    process.exit(0)
})