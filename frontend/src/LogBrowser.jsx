import Icon, {
  SearchOutlined,
  ReloadOutlined,
  UpOutlined,
  DownOutlined,
  FilterFilled,
  PlusCircleOutlined,
  ShrinkOutlined,
  CaretRightOutlined,
  DeleteOutlined,
  CaretDownOutlined,
  BookOutlined,
  FontSizeOutlined,
  FontColorsOutlined,
  StopFilled,
  ArrowsAltOutlined,
  StarFilled,
  SettingFilled,
  FileSearchOutlined,
  EditOutlined,
  CaretUpOutlined,
  DoubleLeftOutlined,
  DoubleRightOutlined,
  QuestionCircleOutlined,
  CloseOutlined,
} from '@ant-design/icons'
import {
  Button,
  Layout,
  Input,
  Space,
  Tooltip,
  Switch,
  Checkbox,
  Slider,
  message,
  Select,
  Modal,
  Dropdown,
  Radio,
  Card,
  InputNumber,
} from 'antd'
import md5 from 'crypto-js/md5'
import { bookCtx } from './LogBrowserEntry'
import { useEffect, useRef, useState, useContext } from 'react'
const { readFileSync, readdirSync, statSync } = require('fs')
const { ipcRenderer } = require('electron')
const { join, basename, extname } = require('path')
const { Sider, Content, Footer } = Layout
import {
  MAX_FILTERS,
  MAX_FILTER_ITEMS,
  MAX_HIGHLIGHT,
  MAX_BOOKMARKS,
  MAX_BOOKMARK_ITEMS,
  MAX_PRESETS,
  VERSION,
  MAX_FILES,
  GOTO_OFFSET,
  GOTO_OFFSET_WRAP,
  MAX_BOOKMARK_TITLE,
  MAX_RECENT_FILES,
  EXTENSION_NAMES,
  lb_presets,
  lb_recent,
  // MAX_FILES_SIZE,
  // DEFAULT_FONT_SIZE,
  // MAX_FONT_SIZE,
  // MIN_FONT_SIZE,
} from './config'
import Draggable from 'react-draggable'
import { Line } from './LineObj'
import { FiltersObj } from './FiltersObj'

const menuList = [
  {
    label: 'Copy Content',
    key: '1',
  },

  {
    label: 'Add Bookmark',
    key: '2',
  },
  {
    label: 'Copy to Clipboard',
    key: '3',
    children: [
      {
        label: 'Copy Full File Path',
        key: '3-1',
      },
      {
        label: 'Copy Filename',
        key: '3-2',
      },
      {
        label: 'Copy Dir. Path',
        key: '3-3',
      },
    ],
  },
]

let copyContent = ''
const size = 100
// let time
const RegSVG = isEnable => (
  <svg
    t="1698115045292"
    viewBox="0 0 1024 1024"
    version="1.1"
    fill={isEnable ? 'blue' : 'black'}
    xmlns="http://www.w3.org/2000/svg"
    p-id="4029"
    width="14"
  >
    <path
      d="M136 836.928c0-32.896 25.088-60.608 58.112-60.608 34.304 0 59.392 27.776 59.392 60.608 0 35.712-25.088 59.456-59.392 59.456-36.992-1.344-58.112-26.432-58.112-59.456zM903.808 398.336l-214.912 42.112 150.336 188.032-92.928 64-120.64-207.744L503.68 692.48l-92.992-64 149.568-188.032-216.32-42.112 37.76-104.576 204.8 78.464-19.648-237.44h116.928l-20.352 237.44 204.8-78.464 35.584 104.576z"
      p-id="4030"
    ></path>
  </svg>
)
// const RegIcon = props => <Icon component={regSVG} {...props} />
window.oncontextmenu = () => (copyContent = window.getSelection().toString())

const dateStr = () => {
  const date = new Date()
  const add0 = num => (num + '').padStart(2, '0')
  return (
    date.getFullYear() +
    '-' +
    add0(date.getMonth() + 1) +
    add0(date.getDate()) +
    '-' +
    add0(date.getHours()) +
    add0(date.getMinutes())
  )
}

const isValidReg = str => {
  try {
    new RegExp(str)
    return true
  } catch {
    return false
  }
}

const allFile = path => {
  // console.log(path)
  const allFiles = []
  try {
    const files = readdirSync(path)
    for (const i of files) {
      const temp = join(path, i)
      if (statSync(temp).isFile()) allFiles.push(temp)
      else allFiles.push(...allFile(temp))
    }
    // console.log(allFiles)
    return allFiles.filter(i => EXTENSION_NAMES.includes(extname(i)))
  } catch {
    return false
  }
}

// const timeReg = /&lt;20\d{2}-\d{2}-\d{2}.*?&gt;/
// const timeReg = /^2.*Z$/
const simplifiedReg =
  /.*?\d{2}:\d{2}:\d{2}.\d{3,8}\s\[\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\:{0,1}\d{0,6}\]/
// /\d{2}:\d{2}:\d{2}.*?\[\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\:\d{2,6}\]/
// /20\d{2}-\d{2}-\d{2}T.*?Z/
// const str2time = log => {
//   const temp = log.match(/<20\d{2}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*>/)
//   if (temp) return temp[0]
//   return '3'
// }
const str2timeReg = /<20\d{2}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*?>/
// const str2time = ({ content }) => content.match(str2timeReg)?.[0] ?? '<3'
// let c = 0

const logSort = (a, b, sortType) => {
  // c += 1
  const aa = a.content.match(str2timeReg)?.[0]
  const bb = b.content.match(str2timeReg)?.[0]
  if (!aa && !bb) return 0
  if (!aa) return sortType
  if (!bb) return -sortType
  if (aa == bb) return 0
  if (aa < bb) return -sortType
  return sortType
}

const numFormat = num => {
  if (!num) return num
  let ans = ''
  num += ''

  while (num.length > 3) {
    ans = ',' + num.slice(-3) + ans
    num = num.slice(0, num.length - 3)
  }
  if (num) ans = num + ans

  return ans
}

// 配色方案
const colors = [
  '#e57373',
  '#a1887f',
  '#9575cd',
  '#7986cb',
  '#4fC3f7',
  '#81c784',
  '#fff176',
  '#ffb74d',
  '#ff00ff',
  '#90a4ae',
  '#2ed26c',
  '#99ccff',
  '#acb9ca',
  '#a8e294',
  '#dfac97',
  '#9e92e4',
]
let recentFiles = JSON.parse(localStorage.getItem(lb_recent)) ?? []

const addRecent = (type, path) => {
  const key = path[0] + (type === 'multifile' ? '...' : '')
  recentFiles = recentFiles.filter(i => i.key !== key)
  recentFiles.push({ type, path, key })
  if (recentFiles.length > MAX_RECENT_FILES)
    recentFiles = recentFiles.slice(
      recentFiles.length - MAX_RECENT_FILES,
      recentFiles.length
    )
  localStorage.setItem(lb_recent, JSON.stringify(recentFiles))
}

const logLines = {}
const filterLog = {}

export default ({ filenamelist, gotolinelist, keynum }) => {
  const {
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
  } = useContext(bookCtx)
  const searchArr = useRef([])
  const colorNum = useRef(0)
  const md5Str = useRef('')
  const filename = useRef('') //第一个文件名
  const files = useRef([]) //文件全路径
  const filesSize = useRef(0) //文件大小
  const lineEle = useRef(null)
  const [messageApi, contextHolder] = message.useMessage({
    top: window.innerHeight / 3,
  })

  const [sortType, setSortType] = useState(0)
  const [anchors, setAnchors] = useState([])
  const [searchTotal, setSearchTotal] = useState(0)
  const [searchNum, setSearchNum] = useState(0)

  const [offset, setOffset] = useState(0)
  const upload_files = useRef(null)
  const upload_folder = useRef(null)
  const searchInp = useRef(null)
  const bookinp = useRef(null)

  const [presetInput, setPresetInput] = useState('')
  const [preset, setPreset] = useState('')
  const [presets, setPresets] = useState(
    JSON.parse(localStorage.getItem(lb_presets)) || {}
  )
  const [toolCollapsed, setToolCollapsed] = useState(false)
  const click_open_files = () => upload_files.current.click()
  const click_open_folder = () => upload_folder.current.click()
  const click_add_tab = () => {
    document.getElementsByClassName('ant-tabs-nav-add')[0].click()
  }
  const [search, setSearch] = useState('')

  const [isHighlightFullWord, _setIsHighlightFullWord] = useState(false)
  const setIsHighlightFullWord = () =>
    _setIsHighlightFullWord(!isHighlightFullWord)
  // let [isSearchReg, setIsSearchReg] = useState(false)
  let [isSearchFullWord, setIsSearchFullWord] = useState(false)
  let [isSearchCaseSensitive, setIsSearchCaseSensitive] = useState(false)
  const [activeLine, setActiveLine] = useState({})
  const [mentions, setMentions] = useState([])
  const [bookTitle, setBookTitle] = useState('')
  const [bookmarkModal, setBookmarkModal] = useState(false)
  const [gotoModal, setGotoModal] = useState(false)
  // let [isLineSort, setIsLineSort] = useState(false)
  const modalInputRef = useRef(null)
  const [editing, setEditing] = useState([]) // 书签编辑中
  // let [filterObj, setFilterObj] = useState()
  const filterObj = useRef(new FiltersObj())
  const isFiltersChangeFlag = useRef(false)
  const [isFiltersRunningFlag, setIsFiltersRunningFlag] = useState(false)
  let [isHLCaseSensitive, _setIsHLCaseSensitive] = useState(false)
  const setIsHLCaseSensitive = () => _setIsHLCaseSensitive(!isHLCaseSensitive)
  const [bookmarks, _setBookmarks] = useState([])
  const [highlights, setHighlights] = useState([['', '#e57373']])
  const [selectWord, setSelectWord] = useState('')
  const [maxWidth, setMaxWidth] = useState(0)
  const [gotoRadio, setGotoRadio] = useState(0)
  const [gotoInput, setGotoInput] = useState('')
  const gotoInputRef = useRef(null)
  const gotoValid = () => {
    if (!gotoInput) return true
    const linenum = +gotoInput + (gotoRadio ? offset : -1)
    if (linenum < 0 || linenum >= filterLog[keynum]?.length) return false
    return true
  }
  // 滚动和横向宽度
  useEffect(() => {
    const w = lineEle.current?.scrollWidth
    if (!w) return
    if (maxWidth < w) setMaxWidth(w)
  }, [offset])

  const submitFilter = () => {
    // 没有内容
    if (!logLines[keynum]?.length) {
      filterLog[keynum] = []
      return
    }

    if (!filterObj.current.enable) {
      filterLog[keynum] = logLines[keynum]
      setOffset(0)
      messageApi.destroy()
      searching()
      reload({})
      return
    }

    messageApi.destroy()
    messageApi.loading('File filtering', 0)
    setIsFiltersRunningFlag(true)
    setTimeout(() => {
      filterLog[keynum] = logLines[keynum].filter(({ content }) => {
        let flag1 = false

        a: for (const j of filterObj.current.filters) {
          if (!j.enable) continue
          let flag2 = false
          for (const k of j.items) {
            if (!k.value) continue
            if (!k.enable) continue
            flag1 = true
            flag2 = true
            let temp
            if (filterObj.current.isReg) {
              if (!isValidReg(k.value)) continue
              temp = new RegExp(k.value).test(content)
            } else if (filterObj.current.isFullWord) {
              if (!isValidReg(k.value)) continue
              temp = new RegExp(`\\b${k.value}\\b`).test(content)
            } else if (filterObj.current.isCaseSensitive)
              temp = content.includes(k.value)
            else {
              const ii = content.toLowerCase()
              const kk = k.value.toLowerCase()
              temp = ii.includes(kk)
            }

            if (!(temp ^ k.inverse)) continue a //不匹配
          }
          if (flag2) return true
        }
        return !flag1
      })
      messageApi.destroy()
      setIsFiltersRunningFlag(false)
      setOffset(0)
      searching()
      reload({})
    }, 300)
  }

  const [showBook, _setShowBook] = useState(false)
  const [, reload] = useState({})

  const setShowBook = () => _setShowBook(!showBook)
  // 清空最近打开
  const delRecent = () => {
    recentFiles = []
    localStorage.removeItem(lb_recent)
    reload({})
  }

  // 打开文件并初始化
  const putFiles = () => {
    logLines[keynum] = []
    filterLog[keynum] = []

    for (let i = 0; i < files.current.length; i++) {
      const path = files.current[i]
      const name = basename(path)
      logLines[keynum] = logLines[keynum].concat(
        readFileSync(path)
          .toString()
          .split(/\r\n|\n|\r/)
          .map((v, idx) => new Line(v + '\n', i, idx + 1, name))
      )
    }

    if (sortType) logLines[keynum].sort((a, b) => logSort(a, b, sortType))

    filterLog[keynum] = logLines[keynum]

    md5Str.current = md5(files.current.join()).toString()
    _setBookmarks(
      JSON.parse(localStorage.getItem('lb_bookmarks'))?.[md5Str.current] ?? []
    )

    setMentions([])

    filterObj.current = new FiltersObj()

    setHighlights([['', '#e57373']])

    setAnchors([])
    setSearch('')
    setIsSearchCaseSensitive(false)
    setIsSearchFullWord(false)

    _setIsHighlightFullWord(false)
    _setIsHLCaseSensitive(false)
    setActiveLine({})
    searchArr.current = []
    setPreset('')
    // inp.current.value = ''
    setOffset(0)
    messageApi.destroy()
  }
  // 重新获取文件
  const reloadFiles = () => {
    logLines[keynum] = []

    for (let i = 0; i < files.current.length; i++) {
      const path = files.current[i]
      const name = basename(path)
      logLines[keynum] = logLines[keynum].concat(
        readFileSync(path)
          .toString()
          .split(/\r\n|\n|\r/)
          .map((v, idx) => new Line(v + '\n', i, idx + 1, name))
      )
    }
    submitFilter()
  }

  // 自己选文件
  const upload = ({ target }, dontSaveRecent, dontRename) => {
    console.log(target.files)
    if (!target.value) return
    messageApi.loading('File loading...', 0)
    const firstFile = target.files[0]

    // 分文件夹和文件得到文件列表
    if (firstFile.webkitRelativePath)
      files.current = [...target.files]
        .map(i => (i.path ? i.path : i))
        .filter(i => EXTENSION_NAMES.includes(extname(i)))
        .slice(0, MAX_FILES)
    else
      files.current = [...target.files]
        .map(i => (i.path ? i.path : i))
        .slice(0, MAX_FILES)

    // 如果没文件就不运行
    if (!files.current.length) {
      messageApi.destroy()
      messageApi.error('Log File does not exist...')
      target.value = ''
      return
    }

    filesSize.current = 0

    // 判断文件是否存在顺便计算大小
    for (const i of files.current) {
      try {
        // accessSync(i)
        filesSize.current += parseInt(statSync(i).size / 1000)
      } catch {
        messageApi.destroy()
        messageApi.error('File "' + i + '" does not exist...')
        return
      }
    }

    // tab名称
    filename.current = basename(files.current[0])
    if (!dontRename)
      rename(
        keynum,
        files.current[1] ? filename.current + '...' : filename.current,
        files.current
      )
    console.log(filename.current)

    // 分文件夹和文件保存到最近
    if (!dontSaveRecent) {
      if (firstFile.webkitRelativePath) {
        const rooPath = firstFile.webkitRelativePath.slice(
          0,
          firstFile.webkitRelativePath.indexOf('/')
        )
        const folder = firstFile.path.slice(
          0,
          firstFile.path.indexOf(rooPath) + rooPath.length + 1
        )
        addRecent('folder', [folder])
      } else if (files.current.length === 1) addRecent('file', files.current)
      else addRecent('multifile', files.current)
    }
    // 读取文件
    setTimeout(() => putFiles(), 300)
  }

  //打开最近文件
  const openRecent = (type, path) => {
    if (type === 'folder') {
      const files = allFile(path[0])
      if (!files)
        return messageApi.error('Folder "' + path + '" does not exist.')
      if (!files.length) return messageApi.error('Folder is empty')
      upload({ target: { value: true, files } }, true)
    } else upload({ target: { value: true, files: path } }, true)
  }

  // 程序打开文件相关
  useEffect(() => {
    console.log(keynum)
    logLines[keynum] = []
    filterLog[keynum] = []
    if (filenamelist?.length) {
      upload({ target: { value: true, files: filenamelist } }, false, true)
      if (gotolinelist?.length) {
        const temp = []
        let goto = null
        for (const i of gotolinelist) {
          const idx = files.current.indexOf(i.filename)
          if (idx == -1) continue
          for (const j of i.line) {
            temp.push(idx + '-' + j)
            if (!goto) goto = [idx, j]
          }

          setTimeout(() => {
            // console.log(temp, goto)
            setMentions(temp)
            gotoLine(...goto)
          }, 1000)
        }
      }
    }
    return () => {
      console.log('delete ' + keynum)
      logLines[keynum] = []
      filterLog[keynum] = []
    }
  }, [])

  const ipcFunc = (_, data) => {
    if (!files.current.length) return
    data.filenamelist.sort()

    if (data.filenamelist + '' !== files.current + '') return

    console.log(data.gotolinelist)
    if (!data.gotolinelist?.length) return setMentions([])

    const temp = []
    let goto = false
    for (const i of data.gotolinelist) {
      const idx = files.current.indexOf(i.filename)
      if (idx == -1) continue
      for (const j of i.line) {
        temp.push(idx + '-' + j)
        if (!goto) goto = [idx, j]
      }
    }
    gotoLine(...goto)
    setMentions(temp)
  }

  useEffect(() => {
    ipcRenderer.on('OPEN_FILES', ipcFunc)
    return () => ipcRenderer.removeListener('OPEN_FILES', ipcFunc)
  }, [files, offset])

  // 搜索相关函数
  const searching = () => {
    if (!search) return setSearchTotal(0)

    console.log('search')
    if (!logLines[keynum]?.length) return
    if (!isValidReg(search)) return

    searchArr.current = []

    filterLog[keynum].forEach((item, index) => {
      let temp
      if (isSearchFullWord)
        temp = new RegExp(`\\b${search}\\b`).test(item.content)
      else if (isSearchCaseSensitive) temp = item.content.includes(search)
      else temp = new RegExp(search, 'i').test(item.content)

      if (temp) searchArr.current.push(index)
    })
    // console.log(searchArr.current)
    setSearchTotal(searchArr.current.length)
    setSearchNum(0)
    const { file, lineNum } = filterLog[keynum][searchArr.current[0]]
    gotoLine(file, lineNum)
    // setOffset(searchArr.current[0])
    // if (searchArr.current.length) next()
  }
  // 搜索跳转
  const next = (step = 1) => {
    if (!search) return
    // console.log(searchArr.current)
    if (!searchArr.current.length) return searching()

    let temp = activeLine.idx ?? 0
    if (step > 0) {
      const back = searchArr.current[searchArr.current.length - 1]
      if (back <= temp) temp = 0
      else {
        for (let i = 0; i < searchArr.current.length; i++) {
          if (searchArr.current[i] > temp) {
            temp = i
            break
          }
        }
      }
    } else {
      if (searchArr.current[0] >= temp) temp = searchArr.current.length - 1
      else {
        for (let i = searchArr.current.length - 1; i >= 0; i--) {
          if (searchArr.current[i] < temp) {
            temp = i
            break
          }
        }
      }
    }

    setSearchNum(temp)

    const { file, lineNum } = filterLog[keynum][searchArr.current[temp]]
    gotoLine(file, lineNum)
  }

  //过滤相关函数

  const setShowItem = i => {
    filterObj.current.filters[i].isShow = !filterObj.current.filters[i].isShow
    reload({})
  }

  const allShow = () => {
    filterObj.current.allShow()
    reload({})
  }
  const allHide = () => {
    filterObj.current.allHide()
    reload({})
  }
  // 加一个过滤
  const addFilter = () => {
    if (!filterObj.current.enable) return
    filterObj.current.addFilter()
    reload({})
  }
  // 加过滤项
  const addFilterItem = i => {
    if (!filterObj.current.enable) return
    filterObj.current.addItem(i)
    reload({})
  }
  // 删除过滤
  const delFilter = i => {
    if (filterObj.current.filters.length === 1)
      return messageApi.warning('cannot delete', 1)
    filterObj.current.delFilter(i)
    submitFilter()
  }
  // 使能过滤
  const enableFilter = i => {
    filterObj.current.filters[i].enable = !filterObj.current.filters[i].enable
    submitFilter()
  }
  const inverseItem = (i, j) => {
    if (!filterObj.current.enable) return

    filterObj.current.filters[i].items[j].inverse =
      !filterObj.current.filters[i].items[j].inverse
    submitFilter()
  }

  const enableItem = (i, j) => {
    filterObj.current.filters[i].items[j].enable =
      !filterObj.current.filters[i].items[j].enable

    submitFilter()
  }

  const delItem = (i, j) => {
    if (!filterObj.current.enable) return
    if (
      filterObj.current.filters.length === 1 &&
      filterObj.current.filters[i].items.length === 1
    )
      return messageApi.warning('cannot delete', 1)
    filterObj.current.delItem(i, j)
    submitFilter()
  }
  const submitFilterInput = () => {
    if (isFiltersChangeFlag.current) {
      isFiltersChangeFlag.current = false
      submitFilter()
    }
  }

  // 滚轮
  const handleWheel = event => {
    // console.log(event)
    const len = filterLog[keynum].length
    if (!len) return
    if (event.ctrlKey) {
      event.deltaY < 0 ? setFontSize(1) : setFontSize(-1)
    } else {
      let temp = offset + (event.deltaY > 0 ? 3 : -3)
      if (temp < 0) temp = 0
      if (temp > len) temp = len - 1
      setOffset(temp)
    }
  }

  const addHL = () => {
    colorNum.current += 1
    if (colorNum.current == 16) colorNum.current = 0
    setHighlights(v => [...v, ['', colors[colorNum.current]]])
  }

  const pickColor = i => {
    colorNum.current += 1
    if (colorNum.current == 16) colorNum.current = 0
    setHighlights(v => {
      const temp = [...v]
      temp[i][1] = colors[colorNum.current]
      return temp
    })
  }

  const delHL = i => {
    if (highlights.length === 1) return messageApi.warning('cannot delete', 1)
    setHighlights(v => {
      const temp = [...v]
      temp.splice(i, 1)
      return temp
    })
  }

  const inpHL = (i, input) =>
    setHighlights(v => {
      const temp = [...v]
      temp[i][0] = input
      return temp
    })

  // const demo = /(?:(?!<span .*>).)*a(?:(?!<\/span .*).)*/

  // 高亮
  const highlight = log => {
    const cache = []
    let i = 11
    const pushCache = (content, color, bgcorlor = true) => {
      cache.push({ content, color, bgcorlor })
      return '##' + i++ + '##'
    }
    // .replace(/</g, '&lt;')
    // .replace(/>/g, '&gt;')
    let html = log
      .replace(/</g, '#@`')
      .replace(/>/g, '#`@')
      .replace(/(#@`)?20\d{2}-\d{2}-\d{2}T.*?Z(#`@)?/, $ =>
        pushCache($, '#006400', false)
      )
    if (isSimplified) html = html.replace(simplifiedReg, '')

    // const regKeys = {}
    let temp = search.trim()
    if (temp && isValidReg(temp)) {
      if (isSearchFullWord) temp = new RegExp(`\\b${temp}\\b`)
      else if (!isSearchCaseSensitive) temp = new RegExp(temp, 'i')

      html = html.replace(temp, $ => pushCache($, '#f0e46a'))
    }

    for (const i of highlights) {
      let temp = i[0].trim()
      if (!(temp && isValidReg(temp))) continue
      // let reg

      if (isHighlightFullWord) temp = new RegExp(`\\b${temp}\\b`)
      else if (!isHLCaseSensitive) temp = new RegExp(temp, 'i')

      html = html.replace(temp, $ => pushCache($, i[1]))
    }

    temp = selectWord.trim()
    if (temp) html = html.replace(temp, $ => pushCache($, 'green'))

    html = html
      .replace(/##(\d\d)##/g, ($, $1) => {
        $1 -= 11
        if (cache[$1].bgcorlor) {
          return cache[$1].color[0] == '#'
            ? `<span style="background-color:${cache[$1].color}">${cache[$1].content}</span>`
            : `<span class="${cache[$1].color}">${cache[$1].content}</span>`
        } else
          return `<span style="color:${cache[$1].color}">${cache[$1].content}</span>`
      })
      .replace(/  /g, '&nbsp;&nbsp;')
      .replace(/#@`/g, '&lt;')
      .replace(/#`@/g, '&gt;')

    return html
  }

  // 下载
  const download = () => {
    messageApi.loading('File saving...', 0)
    setTimeout(() => {
      const blob = new Blob(filterLog[keynum].map(i => i.content))
      const aTag = document.createElement('a')
      const href = window.URL.createObjectURL(blob)
      aTag.href = href
      const temp = filename.current.split('.')

      aTag.download = temp[0] + '-' + dateStr() + '.' + temp[1]
      document.body.appendChild(aTag)
      aTag.click()
      document.body.removeChild(aTag)
      window.URL.revokeObjectURL(href)
      messageApi.destroy()
    }, 300)
  }
  // 验证预设名格式
  const verify = () => /^[0-9a-zA-Z_-]*$/.test(presetInput)
  // 保存预设
  const savePreset = () => {
    if (Object.keys(presets).length === MAX_PRESETS)
      return messageApi.warning(
        'The number of presets has reached the limit.',
        1
      )

    const temp = JSON.parse(localStorage.getItem(lb_presets)) || {}

    temp[presetInput] = {
      filterObj: filterObj.current,
      highlights,
      // attach: [isFilterReg, isHighlightReg, isFilterCaseSensitive],
      attach: {
        isHighlightFullWord,
        isHLCaseSensitive,
      },
    }
    localStorage.setItem(lb_presets, JSON.stringify(temp))
    messageApi.success('Presets saved successfully.', 1)

    setPresets(temp)
    setPreset(presetInput)
    setPresetInput('')
  }
  // 刷新预设
  const reloadPresets = () => {
    let temp = JSON.parse(localStorage.getItem(lb_presets)) || {}
    setPresets(temp)
    if (temp[preset]) {
      temp = temp[preset]
      setHighlights(temp.highlights)
      _setIsHighlightFullWord(temp.attach.isHighlightFullWord)
      _setIsHLCaseSensitive(temp.attach.isHLCaseSensitive)
      filterObj.current = new FiltersObj(temp.filterObj)
      submitFilter()
      // setTimeout(() => setPreset(preset), 300)
    } else setPreset('')
  }
  // 删除预设
  const delPreset = i => {
    const { [i]: _, ...temp } = presets
    setPresets(temp)
    localStorage.setItem(lb_presets, JSON.stringify(temp))
  }
  // 选择预设
  const selectPreset = i => {
    // console.log(i)
    if (!i) {
      setPreset('')
      setHighlights([['', '#e57373']])
      _setIsHighlightFullWord(false)
      _setIsHLCaseSensitive(false)
      filterObj.current = new FiltersObj()
      submitFilter()
      return
    }

    const temp = presets[i]
    setHighlights(temp.highlights)
    _setIsHighlightFullWord(temp.attach.isHighlightFullWord)
    _setIsHLCaseSensitive(temp.attach.isHLCaseSensitive)

    filterObj.current = new FiltersObj(temp.filterObj)
    submitFilter()
    setPreset(i)
    // setTimeout(() => setPreset(i), 100)
  }
  const setBookmarks = books => {
    const temp = JSON.parse(localStorage.getItem('lb_bookmarks')) ?? {}
    temp[md5Str.current] = books

    for (const i of Object.keys(temp).slice(0, -MAX_BOOKMARKS))
      temp[i] = undefined

    localStorage.setItem('lb_bookmarks', JSON.stringify(temp))
    _setBookmarks(books)
  }
  // 右键相关
  const copy = str =>
    navigator.clipboard.writeText(str).then(
      () => messageApi.success('Copy success'),
      () => messageApi.error('Copy failed')
    )

  const chooseMenu = ({ key }) => {
    switch (key) {
      case '1':
        copy(copyContent ? copyContent : activeLine.content)
        break
      case '2':
        setBookmarkModal(true)
        break
      case '3-1':
        copy(files.current[activeLine.file])
        break
      case '3-2':
        copy(activeLine.filename)
        break
      case '3-3':
        copy(
          files.current[activeLine.file].slice(0, -activeLine.filename.length)
        )
        break
    }
  }

  const modalOk = () => {
    if (bookTitle == '')
      return messageApi.warning('Please input the book title!', 1)

    let temp = bookmarks.flat()
    const file_line = activeLine.file + '-' + activeLine.lineNum
    if (temp.includes(file_line))
      return messageApi.warning('This line has already defined a bookmark!', 1)
    if (temp.includes(bookTitle))
      return messageApi.warning('This title has already been used!', 1)
    temp = bookmarks.splice(1 - MAX_BOOKMARK_ITEMS)
    temp.push([file_line, bookTitle])

    setBookmarks(temp)
    setBookTitle('')
    setBookmarkModal(false)
    _setShowBook(true)
  }
  const modalCancel = () => {
    setBookTitle('')
    setBookmarkModal(false)
  }
  // 书签部分
  const delBook = i => {
    const temp = [...bookmarks]
    temp.splice(i, 1)
    setBookmarks(temp)
  }
  const edit = (i, v) => {
    const temp = [...editing]
    temp[i] = true
    setEditing(temp)
    setBookTitle(v)
  }
  const afterEdit = i => {
    if (bookTitle) {
      let temp = [...bookmarks]
      temp[i][1] = bookTitle
      setBookmarks(temp)
      setBookTitle('')
    }
    let temp2 = [...editing]
    temp2[i] = false
    setEditing(temp2)
  }
  const bookTo = k => {
    const [k0, k1] = k.split('-').map(i => +i)
    gotoLine(k0, k1)
  }

  // 此行是否加了书签
  const isBook = line => {
    for (const i of bookmarks) if (line == i[0]) return true
    return false
  }

  // useEffect(() => {
  //   setPreset('')
  // }, [highlights])

  const gotoLine = (file, lineNum, active = true) => {
    // console.log(file, lineNum)
    if (!lineEle.current) return
    // const end = offset + parseInt(lineEle.current.offsetHeight / fontSize) - 1
    // console.log(filterLog[keynum].length)
    let num_of_lines = 0
    const elements = document.getElementsByClassName('lineTr key' + keynum)
    // console.log(elements.length)
    for (let i = 0; i < elements.length; i++) {
      if (elements[i].offsetTop > lineEle.current.offsetHeight) {
        num_of_lines = i - 2
        break
      }
    }
    // 行数不够
    if (!num_of_lines) {
      const temp = elements.length - 1
      num_of_lines = parseInt(
        (temp * lineEle.current.offsetHeight) / elements[temp].offsetTop
      )
    }
    const end = offset + num_of_lines
    for (let i = 0; i < filterLog[keynum].length; i++) {
      if (
        filterLog[keynum][i].lineNum == lineNum &&
        filterLog[keynum][i].file == file
      ) {
        if (i < offset || i > end) {
          const temp = i - parseInt(num_of_lines / 3)
          setOffset(temp >= 0 ? temp : 0)
        }
        if (active) setActiveLine({ ...filterLog[keynum][i], idx: i })

        return true
      }
    }
    return false
  }

  const upDown = up => {
    if (activeLine.idx == null) return

    let idx
    if (up) {
      if (!activeLine.idx) return
      idx = activeLine.idx - 1
    } else {
      if (activeLine.idx === filterLog[keynum].length - 1) return
      idx = activeLine.idx + 1
    }

    const temp = { ...filterLog[keynum][idx], idx }

    setActiveLine(temp)
    if (temp.idx < offset) return setOffset(temp.idx)
    if (up) return

    const endLine = parseInt(
      (lineEle.current.clientHeight -
        document.getElementsByClassName('skyblue')[0].parentElement.offsetTop) /
        fontSize
    )
    // console.log(endLine)
    if (isWrap) {
      if (endLine < 7) setOffset(offset + (endLine < 2 ? 2 : 1))
    } else if (endLine < 3) setOffset(offset + 3 - endLine)
  }

  const pageUp = up => {
    if (!lineEle.current) return
    let num_of_lines = 100
    if (isWrap) {
      const elements = document.getElementsByClassName('lineTr key' + keynum)
      for (let i = 0; i < elements.length; i++) {
        if (elements[i].offsetTop > lineEle.current.offsetHeight) {
          num_of_lines = i - 1
          break
        }
      }
    } else num_of_lines = parseInt(lineEle.current.offsetHeight / fontSize)
    if (up) {
      const temp = offset - num_of_lines
      setOffset(temp < 0 ? 0 : temp)
    } else {
      const temp = offset + num_of_lines
      const len = filterLog[keynum].length - 1
      setOffset(temp > len ? len : temp)
    }
  }
  const scrollTo = w => {
    if (!lineEle.current) return
    lineEle.current.scrollTo(w, 0)
  }

  // 按键事件
  const keyHandle = event => {
    // console.log(event)
    if (event.key === 'ArrowUp') upDown(true)
    if (event.key === 'ArrowDown') upDown(false)
    if (event.key === 'End' || event.key === 'ArrowRight') {
      const active_line_width =
        document.getElementsByClassName('skyblue')[0]?.offsetWidth
      if (!active_line_width) return scrollTo(lineEle.current.scrollWidth)
      if (active_line_width > lineEle.current.offsetWidth)
        scrollTo(active_line_width - lineEle.current.offsetWidth + 100)
    }
    if (event.key === 'Home' || event.key === 'ArrowLeft') {
      scrollTo(0)
    }
    if (event.key === 'PageUp') pageUp(true)
    if (event.key === 'PageDown') pageUp(false)

    if (event.ctrlKey && event.key == 'f') searchInp.current.focus()
    if (activeKey === keynum && event.ctrlKey && event.key == 'n')
      click_add_tab()
    if (activeKey === keynum && event.ctrlKey && event.key == 'o')
      click_open_files()
    if (activeKey === keynum && event.ctrlKey && event.key == 'k')
      click_open_folder()
    if (activeKey === keynum && event.ctrlKey && event.key == 's') download()
    if (event.key == 'F2') {
      // console.log(anchors)
      if (!anchors.length) return

      // 第一次
      const [b0, b1] = anchors[0].split('-').map(i => +i)
      if (!activeLine.lineNum) {
        return gotoLine(b0, b1)
      }

      const [e0, e1] = anchors[anchors.length - 1].split('-').map(i => +i)
      const { file: a0, lineNum: a1 } = activeLine
      if (event.shiftKey) {
        if (event.ctrlKey) return setAnchors([])

        let from
        // 找出from的值
        if ((a0 >= e0 && a1 > e1) || (a0 <= b0 && a1 <= b1))
          from = anchors.length - 1
        else {
          for (let j = anchors.length - 1; j > -1; j--) {
            const [t0, t1] = anchors[j].split('-').map(i => +i)
            if (t0 < a0 || (t0 == a0 && t1 < a1)) {
              from = j
              break
            }
          }
        }
        from += anchors.length
        // 遍历
        for (let j = 0; j < anchors.length; j++) {
          const [t0, t1] = anchors[from % anchors.length]
            .split('-')
            .map(i => +i)
          if (gotoLine(t0, t1)) return

          from--
        }
      } else {
        let from
        // 找出from的值
        if ((a0 >= e0 && a1 >= e1) || (a0 <= b0 && a1 < b1)) from = 0
        else {
          for (let j = 0; j < anchors.length; j++) {
            const [t0, t1] = anchors[j].split('-').map(i => +i)
            if (t0 > a0 || (t0 == a0 && t1 > a1)) {
              from = j
              break
            }
          }
        }
        // 遍历
        for (let j = 0; j < anchors.length; j++) {
          // console.log(from)
          const [t0, t1] = anchors[from % anchors.length]
            .split('-')
            .map(i => +i)
          if (gotoLine(t0, t1)) return

          from++
        }
      }
    }
  }

  const addAnchor = (file, lineNum) => {
    // console.log(anchors)
    const item = file + '-' + lineNum

    const idx = anchors.indexOf(item)

    if (idx ^ -1) {
      const temp = [...anchors]
      temp.splice(idx, 1)
      setAnchors(temp)
    } else {
      const temp = [...anchors]

      for (let i = 0; i < temp.length; i++) {
        const [t0, t1] = temp[i].split('-').map(j => +j)
        if (t0 > file || (t0 == file && t1 > lineNum)) {
          temp.splice(i, 0, item)
          setAnchors(temp)
          return
        }
      }

      temp.push(item)
      setAnchors(temp)
    }
  }

  //监听按键
  useEffect(() => {
    window.addEventListener('keydown', keyHandle)
    return () => window.removeEventListener('keydown', keyHandle)
  })

  const dblclick_select = () => {
    if (activeKey !== keynum) return
    const t = document.getSelection().toString()
    if (!t) return
    console.log(t)
    setSelectWord(t)
  }

  useEffect(() => {
    setSelectWord('')
  }, [activeLine])

  const lineColor = key => {
    // 优先级 激活>gotoLine>锚点
    if (activeLine.file + '-' + activeLine.lineNum == key) return 'skyblue'
    if (mentions.includes(key)) return 'yellow'
    if (anchors?.includes(key)) return 'grey'
  }
  // 书签编辑时聚焦
  useEffect(() => {
    for (const i of editing) if (i) return bookinp.current.focus()
  }, [editing])

  // 排序按钮
  const sortBtn = sortType => {
    setSortType(sortType)
    if (!filename.current) return
    if (sortType) {
      messageApi.loading('File sorting...', 0)
      setTimeout(() => {
        logLines[keynum].sort((a, b) => logSort(a, b, sortType))
        submitFilter()
      }, 500)
    } else {
      messageApi.loading('File loading...', 0)
      setTimeout(() => {
        reloadFiles()
      }, 500)
    }
  }
  const closeGotoModel = () => {
    setGotoInput('')
    setGotoModal(false)
  }

  const okGoto = () => {
    if (!gotoInput) return messageApi.warning('not Valid')
    setGotoModal(false)
    setGotoInput('')
    let goto = +gotoInput + (gotoRadio ? offset : -1)
    const len = filterLog[keynum]?.length - 1
    if (goto < 0) goto = 0
    else if (goto > len) goto = len

    setOffset(goto)
    setActiveLine({ ...filterLog[keynum][goto], idx: goto })
  }

  useEffect(() => {
    if (gotoModal) gotoInputRef.current.focus()
  }, [gotoModal])

  useEffect(() => {
    if (!selectWord) return
    const range = document.createRange()
    const ele = lineEle.current
      .getElementsByClassName('skyblue')[0]
      ?.getElementsByClassName('green')[0]
    if (!ele) return
    range.selectNodeContents(ele)
    const selection = window.getSelection()
    selection.removeAllRanges()
    selection.addRange(range)
  }, [selectWord])

  return (
    <>
      {contextHolder}
      <Modal
        title="Bookmark Title:"
        autoFocusButton="null"
        cancelButtonProps={{
          type: bookTitle ? 'default' : 'primary',
        }}
        okButtonProps={{ type: bookTitle ? 'primary' : 'default' }}
        open={bookmarkModal}
        onOk={modalOk}
        onCancel={modalCancel}
        afterOpenChange={open => open && modalInputRef.current.focus()}
      >
        <Input
          ref={modalInputRef}
          placeholder="Bookmark title"
          value={bookTitle}
          onChange={e => setBookTitle(e.target.value)}
          onPressEnter={modalOk}
          maxLength={MAX_BOOKMARK_TITLE}
        />
      </Modal>

      <Space className="fixed">
        <div
          className="bookBtn"
          style={{ color: showBook && 'blue' }}
          onClick={setShowBook}
        >
          <Tooltip
            title={showBook ? 'Close bookmark bar' : 'Open bookmark bar'}
          >
            <BookOutlined />
            <span>
              <b>Bookmarks({bookmarks.length})</b>
            </span>
          </Tooltip>
        </div>
        <span>V{VERSION}</span>
        <QuestionCircleOutlined
          className="icon"
          title="How to use it?"
          onClick={() => {
            const shell = window.require('electron').shell
            shell.openExternal(
              'https://confluence.ext.net.yong.com/display/5GSE/15_Log+Browser+Home'
            )
          }}
        />
        <span>&nbsp;</span>
      </Space>
      <Layout className="h100">
        <Sider
          className="sider"
          theme="light"
          width={300}
          collapsedWidth={10}
          collapsible
          collapsed={toolCollapsed}
          trigger={null}
        >
          {!toolCollapsed && (
            <>
              <input
                ref={upload_files}
                multiple
                style={{ display: 'none' }}
                type="file"
                // webkitdirectory="true"
                // directory="true"
                onChange={upload}
              />
              <input
                ref={upload_folder}
                style={{ display: 'none' }}
                type="file"
                webkitdirectory="true"
                directory="true"
                onChange={upload}
              />

              {/* search */}
              <div className="search">
                <Space style={{ marginBottom: 10, fontSize: 16 }}>
                  <SearchOutlined />
                  <b>SEARCH</b>

                  <Tooltip
                    title={
                      isSearchFullWord
                        ? 'Disable match whole word'
                        : 'Enable match whole word'
                    }
                  >
                    <FontColorsOutlined
                      style={{ color: isSearchFullWord && 'blue' }}
                      onClick={() => {
                        isSearchFullWord = !isSearchFullWord
                        setIsSearchFullWord(isSearchFullWord)
                        searching()
                      }}
                    />
                  </Tooltip>
                  <Tooltip
                    title={
                      isSearchCaseSensitive
                        ? 'Disable case sensitive'
                        : 'Enable case sensitive'
                    }
                  >
                    <FontSizeOutlined
                      style={{ color: isSearchCaseSensitive && 'blue' }}
                      onClick={() => {
                        isSearchCaseSensitive = !isSearchCaseSensitive
                        setIsSearchCaseSensitive(isSearchCaseSensitive)
                        searching()
                      }}
                    />
                  </Tooltip>
                </Space>

                <span style={{ float: 'right', color: '#777', fontSize: 12 }}>
                  {searchTotal ? searchNum + 1 : 0}/{searchTotal}
                </span>

                <div>
                  <Input
                    ref={searchInp}
                    placeholder="search words"
                    style={{ width: '80%' }}
                    value={search}
                    onChange={v => {
                      setSearch(v.target.value)
                      if (!v.target.value) setSearchTotal(0)
                    }}
                    onPressEnter={searching}
                    onBlur={searching}
                    spellCheck="false"
                    status={isValidReg(search.trim()) || 'error'}
                    allowClear
                  ></Input>

                  <div style={{ float: 'right', paddingTop: 5 }}>
                    <UpOutlined onClick={() => next(-1)} className="updown" />
                    <span>&nbsp;</span>
                    <DownOutlined onClick={() => next()} className="updown" />
                  </div>
                  {!isValidReg(search.trim()) && (
                    <div style={{ fontSize: 10, color: 'red' }}>
                      error regexp.
                    </div>
                  )}
                </div>
              </div>
              {/* presets */}
              <div className="tools">
                <div
                  style={{
                    backgroundColor: '#d8d7d7',
                    padding: '10px 15px',
                    fontSize: 16,
                  }}
                >
                  <SettingFilled />
                  &nbsp;&nbsp;
                  <b>PRESETS</b>
                  &nbsp;&nbsp;
                  <Tooltip title="Refresh presets">
                    <ReloadOutlined className="icon" onClick={reloadPresets} />
                  </Tooltip>
                  {/* <span style={{ fontWeight: 'bold' }}>&nbsp;&nbsp;PRESETS</span> */}
                </div>
                <div style={{ padding: 15 }}>
                  <Select
                    style={{ width: '100%' }}
                    optionLabelProp="label"
                    placeholder="select your preset"
                    allowClear={preset}
                    value={preset}
                    onChange={option => selectPreset(option)}
                  >
                    {Object.keys(presets).map(i => (
                      <Select.Option
                        className="presetsSelector"
                        value={i}
                        key={i}
                        label={i}
                      >
                        <span className="label">{i}</span>
                        <DeleteOutlined
                          className="del"
                          onClick={e => {
                            e.stopPropagation()
                            delPreset(i)
                          }}
                        />
                      </Select.Option>
                    ))}
                  </Select>
                </div>
                {/* filter */}
                <Space
                  style={{
                    backgroundColor: '#d8d7d7',
                    padding: '10px 15px',
                    fontSize: 16,
                    width: '100%',
                  }}
                >
                  <FilterFilled />
                  <b>FILTERS</b>
                  {/* <span style={{ fontWeight: 'bold', fontSize: 15 }}>
                  FILTERS
                </span> */}
                  {filterObj.current.filters.length < MAX_FILTERS && (
                    <Tooltip placement="bottom" title="Add set filter">
                      <PlusCircleOutlined
                        className={
                          (isFiltersRunningFlag || !filterObj.current.enable) &&
                          'iconDisable'
                        }
                        onClick={addFilter}
                      />
                    </Tooltip>
                  )}
                  {filterObj.current.isAllshow() ? (
                    <Tooltip title="Hide all filters">
                      <ShrinkOutlined
                        className={
                          (isFiltersRunningFlag || !filterObj.current.enable) &&
                          'iconDisable'
                        }
                        onClick={allHide}
                      />
                    </Tooltip>
                  ) : (
                    <Tooltip title="Show all filters">
                      <ArrowsAltOutlined
                        className={
                          (isFiltersRunningFlag || !filterObj.current.enable) &&
                          'iconDisable'
                        }
                        onClick={allShow}
                      />
                    </Tooltip>
                  )}
                  {/* 正则 */}
                  <Tooltip
                    title={
                      filterObj.current.isReg
                        ? 'Disable regular expressions'
                        : 'Enable regular expressions'
                    }
                  >
                    <Icon
                      component={() => RegSVG(filterObj.current.isReg)}
                      className={
                        (isFiltersRunningFlag || !filterObj.current.enable) &&
                        'iconDisable'
                      }
                      onClick={() => {
                        if (!filterObj.current.enable) return
                        filterObj.current.isReg = !filterObj.current.isReg
                        submitFilter()
                      }}
                    />
                  </Tooltip>
                  {/* 全词匹配 */}
                  <Tooltip
                    title={
                      filterObj.current.isFullWord
                        ? 'Disable match whole word'
                        : 'Enable match whole word'
                    }
                  >
                    <FontColorsOutlined
                      className={
                        (isFiltersRunningFlag || !filterObj.current.enable) &&
                        'iconDisable'
                      }
                      style={{ color: filterObj.current.isFullWord && 'blue' }}
                      onClick={() => {
                        if (!filterObj.current.enable) return
                        filterObj.current.isFullWord =
                          !filterObj.current.isFullWord
                        submitFilter()
                      }}
                    />
                  </Tooltip>
                  {/* 大小写 */}
                  <Tooltip
                    title={
                      filterObj.current.isCaseSensitive
                        ? 'Disable case sensitive'
                        : 'Enable case sensitive'
                    }
                  >
                    <FontSizeOutlined
                      className={
                        (isFiltersRunningFlag || !filterObj.current.enable) &&
                        'iconDisable'
                      }
                      style={{
                        color: filterObj.current.isCaseSensitive && 'blue',
                      }}
                      onClick={() => {
                        if (!filterObj.current.enable) return
                        filterObj.current.isCaseSensitive =
                          !filterObj.current.isCaseSensitive
                        submitFilter()
                      }}
                    />
                  </Tooltip>

                  <Switch
                    checked={filterObj.current.enable}
                    size="small"
                    disabled={isFiltersRunningFlag}
                    onClick={() => {
                      filterObj.current.enable = !filterObj.current.enable
                      submitFilter()
                    }}
                  />
                </Space>
                {filterObj.current.filters.map((filter, i) => (
                  <Space
                    direction="vertical"
                    key={i}
                    style={{ padding: '10px 15px' }}
                  >
                    <Space style={{ fontSize: 15 }}>
                      {filter.isShow ? (
                        <CaretDownOutlined onClick={() => setShowItem(i)} />
                      ) : (
                        <CaretRightOutlined onClick={() => setShowItem(i)} />
                      )}

                      <span style={{ fontWeight: 'bold', fontSize: 14 }}>
                        SET&nbsp;{i + 1}
                      </span>

                      {filter.items.length < MAX_FILTER_ITEMS && (
                        <Tooltip placement="bottom" title="Add set item">
                          <PlusCircleOutlined
                            className={
                              (isFiltersRunningFlag ||
                                !filterObj.current.enable) &&
                              'iconDisable'
                            }
                            onClick={() => {
                              if (!filterObj.current.enable) return
                              addFilterItem(i)
                            }}
                          />
                        </Tooltip>
                      )}
                      <Tooltip placement="bottom" title="Delete this set">
                        <DeleteOutlined
                          className={
                            (isFiltersRunningFlag ||
                              !filterObj.current.enable) &&
                            'iconDisable'
                          }
                          onClick={() => {
                            if (!filterObj.current.enable) return
                            delFilter(i)
                          }}
                        />
                      </Tooltip>
                      <Switch
                        size="small"
                        disabled={
                          isFiltersRunningFlag || !filterObj.current.enable
                        }
                        checked={filter.enable}
                        onClick={() => enableFilter(i)}
                      />
                    </Space>
                    {filter.isShow &&
                      filter.items.map((item, j) => (
                        <Space key={j} style={{ fontSize: 15 }}>
                          {item.value && (
                            <Checkbox
                              disabled={
                                isFiltersRunningFlag ||
                                !filterObj.current.enable ||
                                !filter.enable
                              }
                              checked={item.enable}
                              onClick={() => enableItem(i, j)}
                            />
                          )}
                          <Input
                            disabled={
                              isFiltersRunningFlag ||
                              !filterObj.current.enable ||
                              !filter.enable
                            }
                            placeholder="add filter"
                            spellCheck="false"
                            value={item.value}
                            onChange={e => {
                              isFiltersChangeFlag.current = true
                              filterObj.current.filters[i].items[j].value =
                                e.target.value
                              reload({})
                            }}
                            onPressEnter={submitFilterInput}
                            onBlur={submitFilterInput}
                          />
                          <Tooltip
                            title={
                              item.inverse
                                ? 'Disable inverse'
                                : 'Enable inverse'
                            }
                          >
                            <StopFilled
                              className={
                                (isFiltersRunningFlag ||
                                  !filterObj.current.enable ||
                                  !filter.enable) &&
                                'iconDisable'
                              }
                              style={{ color: item.inverse ? 'blue' : '' }}
                              onClick={() => inverseItem(i, j)}
                            />
                            {/* <StopOutlined /> */}
                          </Tooltip>
                          <Tooltip title="Delete this item">
                            <DeleteOutlined
                              className={
                                (isFiltersRunningFlag ||
                                  !filterObj.current.enable ||
                                  !filter.enable) &&
                                'iconDisable'
                              }
                              onClick={() => delItem(i, j)}
                            />
                          </Tooltip>
                        </Space>
                      ))}
                  </Space>
                ))}
                {/* HIGHLIGHTS */}
                <Space
                  style={{
                    backgroundColor: '#d8d7d7',
                    padding: '10px 15px',
                    fontSize: 16,
                    width: '100%',
                  }}
                >
                  <StarFilled />
                  <b>HIGHLIGHTS</b>

                  {highlights.length < MAX_HIGHLIGHT && (
                    <Tooltip title="Add a highlight">
                      <PlusCircleOutlined onClick={addHL} />
                    </Tooltip>
                  )}

                  <Tooltip
                    title={
                      isHighlightFullWord
                        ? 'Disable match whole word'
                        : 'Enable match whole word'
                    }
                  >
                    <FontColorsOutlined
                      style={{ color: isHighlightFullWord && 'blue' }}
                      onClick={setIsHighlightFullWord}
                    />
                  </Tooltip>
                  <Tooltip
                    title={
                      isHLCaseSensitive
                        ? 'Disable case sensitive'
                        : 'Enable case sensitive'
                    }
                  >
                    <FontSizeOutlined
                      style={{ color: isHLCaseSensitive && 'blue' }}
                      onClick={setIsHLCaseSensitive}
                    />
                  </Tooltip>
                </Space>

                <div className="highlights">
                  {highlights.map((item, i) => {
                    return (
                      <div key={i} style={{ height: 50 }}>
                        <Space>
                          <Input
                            addonBefore={
                              <div
                                style={{
                                  width: 12,
                                  height: 30,
                                  backgroundColor: item[1],
                                }}
                                onClick={() => pickColor(i)}
                              ></div>
                            }
                            value={item[0]}
                            spellCheck="false"
                            placeholder="add highlight word"
                            onChange={e => inpHL(i, e.target.value)}
                            status={isValidReg(item[0].trim()) || 'error'}
                          />
                          <Tooltip title="Delete this highlight">
                            <DeleteOutlined
                              style={{ fontSize: 16, paddingLeft: 8 }}
                              onClick={() => delHL(i)}
                            />
                          </Tooltip>
                        </Space>
                        {!isValidReg(item[0].trim()) && (
                          <div style={{ fontSize: 10, color: 'red' }}>
                            error regexp.
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                {/* presetsInput */}
                <div
                  className="presetsInput"
                  style={{ padding: '10px 15px', backgroundColor: '#eee' }}
                >
                  <div style={{ overflow: 'hidden' }}>
                    <Input
                      style={{ width: '70%' }}
                      value={presetInput}
                      maxLength={30}
                      onChange={e => setPresetInput(e.target.value)}
                      placeholder="save as preset"
                      spellCheck="false"
                      status={verify() || 'error'}
                    />

                    <Button
                      style={{ float: 'right' }}
                      type="primary"
                      disabled={!(presetInput && verify())}
                      onClick={savePreset}
                    >
                      Save
                    </Button>
                  </div>
                  {!verify() && (
                    <div style={{ fontSize: 10, color: 'red' }}>
                      Can't contain any special characters.
                    </div>
                  )}
                  <span className="clear" onClick={() => selectPreset()}>
                    Clear All
                  </span>
                </div>
                {/* <div>{times}</div> */}
              </div>
            </>
          )}
        </Sider>
        <Layout style={{ overflow: 'hidden' }}>
          <Content>
            {filename.current ? (
              <>
                <div className="slider">
                  <CaretUpOutlined
                    onClick={() => handleWheel({ deltaY: -1 })}
                  />
                  <Slider
                    className="sliderBar"
                    vertical
                    max={filterLog[keynum].length - 1}
                    reverse
                    value={offset}
                    onChange={v => setOffset(v)}
                    tooltip={{ open: false }}
                  />
                  <CaretDownOutlined
                    onClick={() => handleWheel({ deltaY: 1 })}
                  />
                </div>
                {/* loglines */}
                <Dropdown
                  menu={{
                    items: menuList,
                    onClick: chooseMenu,
                  }}
                  trigger={['contextMenu']}
                >
                  <div
                    ref={lineEle}
                    className="loglines"
                    onWheel={handleWheel}
                    onDoubleClick={dblclick_select}
                  >
                    <table
                      style={{
                        minWidth: isWrap ? 0 : maxWidth,
                      }}
                    >
                      <tbody
                        style={{
                          whiteSpace: isWrap ? 'normal' : 'nowrap',
                        }}
                      >
                        {filterLog[keynum]
                          .slice(offset, offset + size)
                          .map((item, idx) => (
                            <tr
                              style={{ fontSize, lineHeight: '100%' }}
                              // pageup用到
                              className={'lineTr key' + keynum}
                              key={idx + offset + ''}
                              title={
                                files.current[item.file] + ', ' + item.lineNum
                              }
                            >
                              <td
                                className="td1"
                                onClick={() =>
                                  addAnchor(item.file, item.lineNum)
                                }
                              >
                                <span
                                  className="lineNum"
                                  style={{
                                    display: isLineNum ? 'inline' : 'none',
                                  }}
                                >
                                  {idx + offset + 1}
                                </span>

                                <div
                                  className="bar"
                                  style={{
                                    backgroundColor:
                                      isBook(item.file + '-' + item.lineNum) &&
                                      '#82A1D8',
                                  }}
                                >
                                  {anchors?.includes(
                                    item.file + '-' + item.lineNum
                                  ) && <div className="anchor"></div>}
                                </div>
                              </td>

                              <td style={{ width: '100%' }}>
                                <span
                                  className={
                                    'line ' +
                                    lineColor(item.file + '-' + item.lineNum)
                                  }
                                  dangerouslySetInnerHTML={{
                                    __html: highlight(item.content),
                                  }}
                                  onClick={() =>
                                    setActiveLine({
                                      ...item,
                                      idx: idx + offset,
                                    })
                                  }
                                  onContextMenu={() =>
                                    setActiveLine({
                                      ...item,
                                      idx: idx + offset,
                                    })
                                  }
                                ></span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </Dropdown>
              </>
            ) : (
              <div style={{ color: '#a8a8a8' }}>
                Please click on the File menu in the left bottom to load the log
                files!
              </div>
            )}
            <div className="sideIcon icon">
              {toolCollapsed ? (
                <DoubleRightOutlined onClick={() => setToolCollapsed(false)} />
              ) : (
                <DoubleLeftOutlined onClick={() => setToolCollapsed(true)} />
              )}
            </div>
          </Content>
          <Footer className="footer">
            <Space>
              <Dropdown
                // disabled={props.files?.length}
                menu={{
                  items: [
                    {
                      key: 5,
                      label: (
                        <a onClick={click_add_tab} className="between">
                          <span>New Tab</span>
                          <span>(Ctrl + N)</span>
                        </a>
                      ),
                    },
                    {
                      key: 1,
                      label: (
                        <a onClick={click_open_files} className="between">
                          <span>Open Files...</span>
                          <span>(Ctrl + O)</span>
                        </a>
                      ),
                    },
                    {
                      key: 2,
                      label: (
                        <a onClick={click_open_folder} className="between">
                          <span>Open Folder...&nbsp;&nbsp;</span>
                          <span>(Ctrl + K)</span>
                        </a>
                      ),
                    },
                    {
                      key: 3,
                      label: 'Open Recent',
                      children: [
                        ...recentFiles.map(({ type, path, key }) => ({
                          key,
                          label: (
                            <a
                              title={path}
                              onClick={() => openRecent(type, path)}
                            >
                              {key}
                            </a>
                          ),
                        })),
                        {
                          type: 'divider',
                        },
                        {
                          key: 'clear',
                          label: (
                            <a onClick={delRecent}>Clear Recently Opened</a>
                          ),
                        },
                      ],
                    },
                    {
                      key: 4,
                      label: (
                        <a onClick={download} className="between">
                          <span>Save As...</span>
                          <span>(Ctrl + S)</span>
                        </a>
                      ),
                      disabled: !filename.current,
                    },
                  ],
                }}
              >
                <Button className="viewBtn" icon={<UpOutlined />}>
                  File
                </Button>
              </Dropdown>
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 1,
                      label: (
                        <a onClick={setIsLineNum}>
                          {isLineNum
                            ? '☑️ Enable Line Numberation'
                            : '🔲 Enable Line Numberation'}
                        </a>
                      ),
                    },
                    {
                      key: 2,
                      label: (
                        <a onClick={setIsSimplified}>
                          {isSimplified
                            ? '☑️ Trim Line Beginning'
                            : '🔲 Trim Line Beginning'}
                        </a>
                      ),
                    },
                    {
                      key: 3,
                      label: (
                        <a onClick={setIsWrap}>
                          {isWrap ? '☑️ Word Wrap' : '🔲 Word Wrap'}
                        </a>
                      ),
                    },
                    {
                      type: 'divider',
                    },
                    {
                      key: 4,
                      label: 'Sort by Timestamp',
                      children: [
                        {
                          key: 41,
                          label:
                            sortType == 1 ? (
                              '☑️ Name A to Z'
                            ) : (
                              <a onClick={() => sortBtn(1)}>🔲 Name A to Z</a>
                            ),
                        },
                        {
                          key: 42,
                          label:
                            sortType == -1 ? (
                              '☑️ Name Z to A'
                            ) : (
                              <a onClick={() => sortBtn(-1)}>🔲 Name Z to A</a>
                            ),
                        },
                        {
                          key: 43,
                          label:
                            sortType == 0 ? (
                              '☑️ Default'
                            ) : (
                              <a onClick={() => sortBtn(0)}>🔲 Default</a>
                            ),
                        },
                      ],
                    },

                    {
                      key: 5,
                      label: 'Zoom',
                      children: [
                        {
                          key: 6,
                          label: (
                            <a
                              onClick={() =>
                                handleWheel({ deltaY: -1, ctrlKey: true })
                              }
                              className="between"
                            >
                              <span>Zoom In</span>
                              <span>(Ctrl + Mouse Wheel Up)</span>
                            </a>
                          ),
                        },
                        {
                          key: 7,
                          label: (
                            <a
                              onClick={() =>
                                handleWheel({ deltaY: 1, ctrlKey: true })
                              }
                              className="between"
                            >
                              <span>Zoom Out&nbsp;&nbsp;</span>
                              <span>(Ctrl + Mouse Wheel Down)</span>
                            </a>
                          ),
                        },
                        {
                          key: 8,
                          label: (
                            <a onClick={() => setFontSize()}>
                              Restore Default Zoom
                            </a>
                          ),
                        },
                      ],
                    },
                  ],
                }}
              >
                <Button className="viewBtn" icon={<UpOutlined />}>
                  View
                </Button>
              </Dropdown>
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 1,
                      label: (
                        <a onClick={() => setGotoModal(!gotoModal)}>
                          <span>Go to...&nbsp;&nbsp;</span>
                        </a>
                      ),
                      disabled: !filename.current,
                    },
                  ],
                }}
              >
                <Button className="viewBtn" icon={<UpOutlined />}>
                  Search
                </Button>
              </Dropdown>
            </Space>

            {filename.current && (
              <div className="info">
                {activeLine.filename}
                {activeLine.filename ? '/' : ''}
                {numFormat(activeLine.lineNum)}
                &nbsp;&nbsp;&nbsp;Files:&nbsp;
                {files.current.length}&nbsp;&nbsp;Size:&nbsp;
                {numFormat(filesSize.current)}KB&nbsp;&nbsp;Lines:&nbsp;
                {numFormat(offset) + '/' + numFormat(filterLog[keynum].length)}
                &nbsp;&nbsp;
              </div>
            )}
          </Footer>
        </Layout>
        {showBook && (
          <Sider theme="light" width={200} style={{ padding: 10 }}>
            {bookmarks.length ? (
              bookmarks.map(([k, v], i) => (
                <div key={k} className="bookmark">
                  {editing[i] ? (
                    <Input
                      ref={bookinp}
                      style={{ width: 120 }}
                      value={bookTitle}
                      size="small"
                      spellCheck="false"
                      maxLength={MAX_BOOKMARK_TITLE}
                      onChange={e => setBookTitle(e.target.value)}
                      onPressEnter={() => afterEdit(i)}
                      onBlur={() => afterEdit(i)}
                    />
                  ) : (
                    <a className="aTag" onClick={() => bookTo(k)}>
                      <FileSearchOutlined />
                      {v}
                    </a>
                  )}
                  <span style={{ float: 'right' }}>
                    {editing[i] || <EditOutlined onClick={() => edit(i, v)} />}
                    <span>&nbsp;</span>
                    <DeleteOutlined
                      className="delIcon"
                      onClick={() => delBook(i)}
                    />
                  </span>
                </div>
              ))
            ) : (
              <div>
                There are no bookmarks added yet. To add a bookmark, hover over
                the line, right-click on it and choose “Add bookmark”.
              </div>
            )}
          </Sider>
        )}
      </Layout>
      {gotoModal && (
        <Draggable>
          <Card
            title="Go to...:"
            extra={<CloseOutlined onClick={closeGotoModel} className="close" />}
            className="absolute"
          >
            <Radio.Group
              onChange={e => setGotoRadio(e.target.value)}
              value={gotoRadio}
            >
              <Radio value={0}>Line</Radio>
              <Radio value={1}>offset</Radio>
            </Radio.Group>
            <table>
              <tbody>
                <tr>
                  <td>You are here: </td>
                  <td>{offset + 1}</td>
                </tr>

                <tr>
                  <td>You want to go to: </td>
                  <td>
                    <Input
                      ref={gotoInputRef}
                      type="number"
                      value={gotoInput}
                      onChange={e => setGotoInput(e.target.value)}
                      onPressEnter={okGoto}
                      // status={gotoValid() ? null : 'error'}
                    />
                  </td>
                </tr>
                <tr>
                  <td>You can't go further than: &nbsp;&nbsp;&nbsp;&nbsp;</td>
                  <td>{filterLog[keynum]?.length}</td>
                </tr>
              </tbody>
            </table>

            <div className="end">
              <Button onClick={closeGotoModel}>Cancel</Button>
              &nbsp;&nbsp;&nbsp;&nbsp;
              <Button onClick={okGoto} type="primary">
                OK
              </Button>
            </div>
          </Card>
        </Draggable>
      )}
    </>
  )
}
