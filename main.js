const { app, BrowserWindow, ipcMain } = require('electron')

//调式开关
let debug_sw = 1

let win, testWin

// if (app.isPackaged) {
//   Menu.setApplicationMenu(null)
// }

app.whenReady().then(() => {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (debug_sw == 1) {
    testWin = new BrowserWindow({
      width: 300,
      height: 200,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    })
    testWin.loadFile('./test/test.html')
  }

  app.isPackaged
    ? win.loadFile('./vite/index.html')
    : win.loadURL('http://localhost:5173/')
})

let b = 0

const goLines = [
  {
    filenamelist: ['./log/1.log'],
    gotolinelist: [{ filename: './log/1.log', line: [10, 100, 1000] }],
  },
  {
    filenamelist: ['./log/3.log'],
  },
  {
    filenamelist: ['./log/3.log'],
    gotolinelist: [],
  },
  {
    filenamelist: ['./log/1.log', './log/2.log'],
    gotolinelist: [
      { filename: './log/1.log', line: [100, 1000] },
      { filename: './log/2.log', line: [20, 200, 2000] },
    ],
  },
]

// ipcMain.on('func1', () => {
//   console.log('func1')
//   win.webContents.send('OPEN_FILES', file_arr[a++ % 3])
// })

ipcMain.on('func2', () => {
  console.log('func2')
  win.webContents.send('OPEN_LB', goLines[b++ % goLines.length])
})

app.on('window-all-closed', () => app.quit())
