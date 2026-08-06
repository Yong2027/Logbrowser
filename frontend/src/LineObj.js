export class Line {
  // 内容 第几个文件 第几行 文件名
  constructor(content, file, lineNum, filename) {
    this.content = content
    this.file = file
    this.lineNum = lineNum
    this.filename = filename
  }
}
