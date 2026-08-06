import LogBrowser from './LogBrowser'
const { ipcRenderer } = require('electron')
import { useState, useMemo } from 'react'

export default () => {
  const [files, setFiles] = useState([])
  const [goto, setGoto] = useState({})

  useMemo(
    () =>
      ipcRenderer.on('OPEN_FILES', (_, data) => {
        // console.log(data)
        if (!data.length) return
        data.sort()
        if (data.join() !== files.join()) setFiles(data)
      }),
    []
  )
  useMemo(
    () =>
      ipcRenderer.on('GOTO_LINE', (_, data) => {
        if (!data.lines || !data.filename) return

        setGoto(data)
      }),
    []
  )
  return <LogBrowser files={files} goto={goto} />
}
