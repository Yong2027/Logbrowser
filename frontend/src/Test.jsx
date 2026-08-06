import { useState } from 'react'
import './style.scss'
const { readFileSync, statSync } = require('fs')

let logs = []

export default () => {
  const [size, setSize] = useState(0)
  const upload = ({ target }) => {
    logs = null
    let _size = 0
    console.log(target.files)
    logs = []

    for (const i of [...target.files].map(i => i.path)) {
      logs = logs.concat(
        readFileSync(i)
          .toString()
          .split(/\r\n|\n|\r/)
      )
      _size += parseInt(statSync(i).size / 1000)
    }
    setSize(_size)
  }

  return (
    <>
      <input type="file" multiple onChange={upload} />
      <div>{size}KB</div>
      <div>{logs.length}</div>
      {logs.slice(0, 50).map(i => (
        <div className="text">{i}</div>
      ))}
    </>
  )
}
