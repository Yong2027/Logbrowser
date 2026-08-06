import { Tabs } from 'antd'
import { useState, createContext, useEffect } from 'react'
import {
  lb_lineNum,
  lb_trim,
  lb_wrap,
  MAX_TABS,
  lb_fontsize,
  DEFAULT_FONT_SIZE,
  MAX_FONT_SIZE,
  MIN_FONT_SIZE,
} from './config'
const { ipcRenderer } = require('electron')
import LogBrowser from './LogBrowser'
const { basename } = require('path')

// import { BookOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import './logbrowser.scss'
// import LogBrowserAdapter from './LogBrowserAdapter'
export const bookCtx = createContext()

let newKey = 1

// const tabsFiles = {}

export default () => {
  let [activeKey, setActiveKey] = useState(1)
  const [isWrap, _setIsWrap] = useState(!!localStorage.getItem(lb_wrap))

  const setIsWrap = () => {
    if (isWrap) {
      localStorage.removeItem(lb_wrap)
      _setIsWrap(false)
    } else {
      localStorage.setItem(lb_wrap, 'true')
      _setIsWrap(true)
    }
  }
  const [isSimplified, _setIsSimplified] = useState(
    !!localStorage.getItem(lb_trim)
  )
  const setIsSimplified = () => {
    if (isSimplified) {
      localStorage.removeItem(lb_trim)
      _setIsSimplified(false)
    } else {
      localStorage.setItem(lb_trim, 'true')
      _setIsSimplified(true)
    }
  }
  const [isLineNum, _setIsLineNum] = useState(
    !!localStorage.getItem(lb_lineNum)
  )
  const setIsLineNum = () => {
    if (isLineNum) {
      localStorage.removeItem(lb_lineNum)
      _setIsLineNum(false)
    } else {
      localStorage.setItem(lb_lineNum, 'true')
      _setIsLineNum(true)
    }
  }

  const [fontSize, _setFontSize] = useState(
    +(localStorage.getItem(lb_fontsize) ?? DEFAULT_FONT_SIZE)
  )
  const setFontSize = step => {
    if (step) {
      let temp = fontSize + step
      if (temp < MIN_FONT_SIZE) temp = MIN_FONT_SIZE
      if (temp > MAX_FONT_SIZE) temp = MAX_FONT_SIZE
      if (temp !== fontSize) {
        _setFontSize(temp)
        localStorage.setItem(lb_fontsize, temp)
      }
    } else {
      _setFontSize(DEFAULT_FONT_SIZE)
      localStorage.setItem(lb_fontsize, DEFAULT_FONT_SIZE)
    }
  }

  // 标签初始化定义
  let [tabs, setTabs] = useState([
    {
      label: '📄 New Log 1',
      children: <LogBrowser keynum={newKey} />,
      key: newKey,
      closable: false,
    },
  ])

  const ipcFunc = (_, data) => {
    // console.log(data)
    if (!data.filenamelist) return

    data.filenamelist.sort()
    const nameStr = data.filenamelist.join(';')
    // console.log(tabs)
    for (const i of tabs) {
      if (i.fileStr === nameStr) {
        // setTabs([...tabs])
        setActiveKey(i.key)

        return
      }
    }

    const key = ++newKey
    activeKey = key
    const name = basename(data.filenamelist[0])
    // console.log(tabs)

    tabs.push({
      label: (
        <div title={data.filenamelist.join('\n')}>
          {'📝 ' + (data.filenamelist[1] ? name + '...' : name)}
        </div>
      ),
      children: (
        <LogBrowser
          filenamelist={data.filenamelist}
          gotolinelist={data.gotolinelist}
          keynum={key}
        />
      ),
      key,
      fileStr: data.filenamelist.join(';'),
    })
    if (tabs.length > MAX_TABS) tabs.shift()

    setTabs([...tabs])
    setActiveKey(key)
  }

  useEffect(() => {
    ipcRenderer.on('OPEN_FILES', ipcFunc)
    return () => ipcRenderer.removeListener('OPEN_FILES', ipcFunc)
  }, [tabs])

  // 标签重命名
  // const rename = (filename, files) => {
  //   for (const i of tabs) {
  //     if (i.key == activeKey) {
  //       i.label = <div title={files.join('\n')}>{'📝 ' + filename}</div>
  //       i.fileStr = files.join(';')
  //       setTabs([...tabs])
  //       return
  //     }
  //   }
  // }
  const rename = (key, filename, files) => {
    for (const i of tabs) {
      if (i.key == key) {
        i.label = <div title={files.join('\n')}>{'📝 ' + filename}</div>
        i.fileStr = files.join(';')
        setTabs([...tabs])
        return
      }
    }
  }

  // 点击标签激活
  const onChange = key => setActiveKey(key)

  // 添加标签
  const add = () => {
    const key = ++newKey
    activeKey = key
    tabs.push({
      label: '📄 New Log ' + key,
      children: <LogBrowser keynum={activeKey} />,
      key,
      fileStr: '',
    })
    if (tabs.length > MAX_TABS) tabs.shift()
    setTabs([...tabs])
    setActiveKey(key)
  }

  // 删除标签
  const remove = key => {
    if (tabs.length === 1) return
    // const temp = [...tabs]
    for (let i = 0; i < tabs.length; i++) {
      if (tabs[i].key === key) {
        tabs.splice(i, 1)
        setTabs([...tabs])

        if (key === activeKey) setActiveKey(tabs[i - 1].key)
        // console.log(tabs)
        return
      }
    }
  }

  const onEdit = (key, action) => (action === 'add' ? add() : remove(key))

  return (
    <bookCtx.Provider
      value={{
        // rename,
        rename,
        activeKey,
        isSimplified,
        setIsSimplified,
        isWrap,
        setIsWrap,
        isLineNum,
        setIsLineNum,
        fontSize,
        setFontSize,
      }}
    >
      <Tabs
        style={{ height: '100vh' }}
        type="editable-card"
        size="small"
        onChange={onChange}
        activeKey={activeKey}
        onEdit={onEdit}
        items={tabs}
      />
    </bookCtx.Provider>
  )
}
