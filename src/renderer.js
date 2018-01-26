const { ipcRenderer } = require('electron')
const { BrowserWindow } = require('electron').remote

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

const electronPackageQuery = {
    query: `{
        electronPackages {
            items {
                name,
                author,
                entry,
                packagePath,
            }
        }
    }`
}

const defaultHeaders = {
    'Content-Type': 'application/json'
}

const launcher = document.querySelector("#theme-launch")
launcher.addEventListener("click", () => {
    const selection = document.querySelector("#theme-select")
    const dataLocation = selection.item(selection.selectedIndex).getAttribute("data-theme-location")
    let win = new BrowserWindow({width: 1280, height: 720,
        show: false,  frame: false})
    win.loadURL(dataLocation)
    win.once('ready-to-show', () => {
        win.show()
    })
})

ipcRenderer.on('snowflake-graphql-pong', (status) => {
    if (status){
        console.log("Snowflake GraphQL Endpoint Connected.")
        console.log(electronPackageQuery)
        window.clearInterval(graphQlCheck)

        fetch("http://localhost:9797", {
            method: "POST",
            credentials: 'include',
            headers: Object.assign({}, defaultHeaders),
            body: JSON.stringify(electronPackageQuery)
        }).then((response) => {
            return response.json()
        }).then((data) => {
            const selection = document.querySelector("#theme-select")
            data.data.electronPackages.items.forEach(({ name, packagePath, entry }) => {
                const themeOption = document.createElement("option")
                const locationAttr = document.createAttribute("data-theme-location")
                locationAttr.value = packagePath + "\\" + entry
                themeOption.text = name
                themeOption.attributes.setNamedItem(locationAttr)
                selection.add(themeOption)
            })
            console.log(packagePath, entry)
            //window.open(packagePath + "\\" + entry)
        }).catch(() => {

        })
    } else {
        console.log("Snowflake GraphQL Endpoint Offline.")
    }
})


