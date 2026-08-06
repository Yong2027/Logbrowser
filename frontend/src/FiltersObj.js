// filters 包涵多个 filter

const initItem = {
  value: '',
  enable: true,
  inverse: false,
}

const initSets = {
  items: [
    {
      value: '',
      enable: true,
      inverse: false,
    },
  ],
  enable: true,
  isShow: true,
}
const initFilters = {
  filters: [
    {
      items: [
        {
          value: '',
          enable: true,
          inverse: false,
        },
      ],
      enable: true,
      isShow: true,
    },
  ],
  enable: true,
  isCaseSensitive: false,
  isFullWord: false,
  isReg: false,
}

export class FiltersObj {
  constructor(
    filterObj = {
      filters: [
        {
          items: [
            {
              value: '',
              enable: true,
              inverse: false,
            },
          ],
          enable: true,
          isShow: true,
        },
      ],
      enable: true,
      isCaseSensitive: false,
      isFullWord: false,
      isReg: false,
    }
  ) {
    this.filters = filterObj.filters
    this.enable = filterObj.enable
    this.isCaseSensitive = filterObj.isCaseSensitive
    this.isFullWord = filterObj.isFullWord
    this.isReg = filterObj.isReg

    // 函数
    // 是不是全部都展开了
    this.isAllshow = function () {
      for (const i of this.filters) {
        if (!i.isShow) return false
      }

      return true
    }
    this.allShow = function () {
      for (const i of this.filters) i.isShow = true
      return this
    }
    this.allHide = function () {
      for (const i of this.filters) i.isShow = false
      return this
    }
    // 加减项
    this.addFilter = function () {
      this.filters.push({
        items: [
          {
            value: '',
            enable: true,
            inverse: false,
          },
        ],
        enable: true,
        isShow: true,
      })
      return this
    }
    this.delFilter = function (i) {
      this.filters.splice(i, 1)
      return this
    }
    this.addItem = function (i) {
      this.filters[i].items.push({
        value: '',
        enable: true,
        inverse: false,
      })

      return this
    }
    this.delItem = function (i, j) {
      if (this.filters[i].items.length === 1) this.filters.splice(i, 1)
      else this.filters[i].items.splice(j, 1)
      return this
    }
  }
}
