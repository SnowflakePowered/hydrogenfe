const { ipcRenderer } = require('electron')
const editor = ace.edit("editor")
const session = editor.session
const isEmpty = str => {
    return str.replace(/^\s+|\s+$/g, '').length == 0;
}

editor.setShowPrintMargin(false)
editor.setReadOnly(true)
ipcRenderer.on('snowflake-status', (event, message) => {
    
    /** @type { HTMLTextAreaElement } */
    const consoleArea = document.getElementById("editor")
    
    /** @type { string[] } */
    let messages = message.split(/\r?\n/)
    messages.forEach((out) => {
        if (!isEmpty(out)) {
            requestAnimationFrame(() => {
                session.insert({
                    row: session.getLength(),
                    column: 0
                 }, "\n" + out)
                 editor.resize()
                 editor.scrollToLine(session.getLength(), false, true, () => {
                     requestAnimationFrame()
                 })
            })
        }
    })
})

let graphQlCheck = window.setInterval(() => {
    ipcRenderer.send('snowflake-graphql-ping')
}, 1000)

ipcRenderer.on('snowflake-graphql-pong', (status) => {
    if (status){
        console.log("Snowflake GraphQL Endpoint Connected.")
        window.clearInterval(graphQlCheck)
    } else {
        console.log("Snowflake GraphQL Endpoint Offline.")
    }
})


