var getScriptPromisify = (src) => {
  return new Promise(resolve => {
    $.getScript(src, resolve)
  })
};

var parseMetadata = metadata => {
  const { dimensions: dimensionsMap, mainStructureMembers: measuresMap } = metadata;
  const dimensions = [];
  for (const key in dimensionsMap) {
    const dimension = dimensionsMap[key];
    dimensions.push({ key, ...dimension });
  }
  const measures = [];
  for (const key in measuresMap) {
    const measure = measuresMap[key];
    measures.push({ key, ...measure });
  }
  return { dimensions, measures, dimensionsMap, measuresMap };
};

function stringToBoolean(str) {
  switch (str) {
    case "true":
      return true;
    case "false":
      return false;
    default:
      return;
  }
}

function loadCss(url) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`link[href="${url}"]`)) {
      // 如果样式已经加载，直接 resolve
      resolve();
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;

    link.onload = () => resolve(); // 样式加载成功
    link.onerror = () => reject(new Error(`Failed to load CSS: ${url}`)); // 样式加载失败

    document.head.appendChild(link);
  });
};

function formatWithUnit(value, options) {
  const { 
    decimalPlaces = 2, 
    thousandSeparator = ',', 
    decimalSeparator = '.', 
    unit = '', // 默认无单位
    scale = 1
  } = options;

  // 动态单位处理
  let formattedValue = value;
  let selectedUnit = unit;

  formattedValue = value / scale;

  // if (!unit) { // 如果未指定单位，动态分配
  //   if (value >= 1e8) { // 亿
  //     formattedValue = value / 1e8;
  //     selectedUnit = '亿';
  //   } else if (value >= 1e4) { // 万
  //     formattedValue = value / 1e4;
  //     selectedUnit = '万';
  //   } else if (value >= 1e3) { // 千
  //     formattedValue = value / 1e3;
  //     selectedUnit = '千';
  //   }
  // }

  // 格式化数值
  const fixedValue = formattedValue.toFixed(decimalPlaces);
  const [integerPart, decimalPart] = fixedValue.split('.');

  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);
  const result = decimalPart
    ? formattedInteger + decimalSeparator + decimalPart + selectedUnit
    : formattedInteger + selectedUnit;

  return result;
}

function indentRenderer(instance, td, row, col, prop, value, cellProperties) {
  // 清除默认的渲染内容
  Handsontable.renderers.BaseRenderer.apply(this, arguments);

  if (value !== null && value !== undefined) {
    const indentLevel = cellProperties.indentLevel || 0; // 从单元格属性中获取缩进层级
    const indentSize = 20; // 每层缩进的宽度
    td.style.textIndent = `${indentLevel * indentSize}px`; // 应用缩进
    td.innerHTML = value; // 渲染单元格内容
  }
}

function combinedRenderer(instance, td, row, col, prop, value, cellProperties) {
  // 首先应用缩进渲染逻辑
  indentRenderer(instance, td, row, col, prop, value, cellProperties);

  // 然后应用原有的数值格式化逻辑
  if (typeof value === 'number') {
    let formattedValue;
    if (this.myCustomThousandSeparator === 1){ 
      //12,345.67
      formattedValue = formatWithUnit(value, {
        decimalPlaces: this.mycustomDecimalPlaces,
        thousandSeparator: ',', 
        decimalSeparator: '.' ,
        unit: this.mycustomUnit,
        scale: this.mycustomScale
      });
    }else if(this.myCustomThousandSeparator === 2){
      //12.345,67
      formattedValue = formatWithUnit(value, {
        decimalPlaces: this.mycustomDecimalPlaces,
        thousandSeparator: '.', 
        decimalSeparator: ',' ,
        unit: this.mycustomUnit,
        scale: this.mycustomScale
      });
    } else if(this.myCustomThousandSeparator === 3){
      //12 345.67
      formattedValue = formatWithUnit(value, {
        decimalPlaces: this.mycustomDecimalPlaces,
        thousandSeparator: ' ', 
        decimalSeparator: '.' ,
        unit: this.mycustomUnit,
        scale: this.mycustomScale
      });
    } else{
      //12345.67
      formattedValue = formatWithUnit(value, {
        decimalPlaces: this.mycustomDecimalPlaces,
        thousandSeparator: '', 
        decimalSeparator: '.' ,
        unit: this.mycustomUnit,
        scale: this.mycustomScale
      });
    }
    td.style.color = 'blue'; // 设置公式结果的样式
    td.textContent = formattedValue;
  }

  // 如果有缩进级别，应用缩进样式
  if (cellProperties.indentLevel) {
    td.style.paddingLeft = `${cellProperties.indentLevel * 10}px`;
  }
}

(function () {
  const prepared = document.createElement('template')
  prepared.innerHTML = `
      <style>
        @import url("https://tomato-nana.github.io/Linnate.github.io/handsontable.full.min.css");
      </style>
      <div id="root" style="width: 100%; height: 100%;"></div>
    `
  
  class SamplePrepared extends HTMLElement {
    constructor () {
      super()

      this._shadowRoot = this.attachShadow({ mode: 'open' })
      this._shadowRoot.appendChild(prepared.content.cloneNode(true))

      this._root = this._shadowRoot.getElementById('root')
      this._props = {}

      // 为 _root 设置固定宽高样式
      const style = document.createElement('style');
      style.textContent = `
        #root {
          width: 600px; /* 固定宽度 */
          height: 420px; /* 固定高度 */
          overflow: auto; /* 启用滚动轴 */
        }
      `;
      this._shadowRoot.appendChild(style);

      // this.myIndentSettings = [];  // 将缩进设置存储在内存中
      // this.myInsertData = [];  // 保存新增的行列记录
      // this.myMergeData = [];  //保存合并单元格的信息
      this.isLoadingMergeCells = false; // 标记变量
      // this.myCustomDecimalPlaces = 2;
      // this.myCustomUnit = '';
      // this.myCustomScale = 1;
      // this.myCustomThousandSeparator = 0;
      // this.myRowHeader = false;
      // this.myColHeader = false;

      this._hotInstance = null;
      this._selectedDataPoint = {};
      this._selectedRange = null;  // 新增属性保存选区信息

      //！！！！！把这个去掉之后单位可以显示了
      // this.render()
    }

    // setMyIndentSettings (myIndentSettings) {
    //   this.myIndentSettings = myIndentSettings
    //   this.dispatchEvent(new CustomEvent('propertiesChanged', { detail: { properties: { myIndentSettings } } }))
    //   this.render()
    // }

    // setMyInsertData (myInsertData) {
    //   this.myInsertData = myInsertData
    //   this.dispatchEvent(new CustomEvent('propertiesChanged', { detail: { properties: { myInsertData } } }))
    //   this.render()
    // }

    // setMyMergeData (myMergeData) {
    //   this.myMergeData = myMergeData
    //   this.dispatchEvent(new CustomEvent('propertiesChanged', { detail: { properties: { myMergeData } } }))
    //   this.render()
    // }

    setCustomUnit (myCustomUnit) {
      this.myCustomUnit = myCustomUnit
      this.dispatchEvent(new CustomEvent('propertiesChanged', { detail: { properties: { myCustomUnit } } }))
      this.render()
    }

    setCustomScale (myCustomScale) {
      this.myCustomScale = myCustomScale
      this.dispatchEvent(new CustomEvent('propertiesChanged', { detail: { properties: { myCustomScale } } }))
      this.render()
    }

    setCustomDecimalPlaces (myCustomDecimalPlaces) {
      this.myCustomDecimalPlaces = myCustomDecimalPlaces
      this.dispatchEvent(new CustomEvent('propertiesChanged', { detail: { properties: { myCustomDecimalPlaces } } }))
      this.render()
    }

    setCustomThousandSeparator (myCustomThousandSeparator) {
      this.myCustomThousandSeparator = myCustomThousandSeparator
      this.dispatchEvent(new CustomEvent('propertiesChanged', { detail: { properties: { myCustomThousandSeparator } } }))
      this.render()
    }

    setRowHeader (myRowHeader) {
      this.myRowHeader = myRowHeader
      this.dispatchEvent(new CustomEvent('propertiesChanged', { detail: { properties: { myRowHeader } } }))
      this.render()
    }

    setColHeader (myColHeader) {
      this.myColHeader = myColHeader
      this.dispatchEvent(new CustomEvent('propertiesChanged', { detail: { properties: { myColHeader } } }))
      this.render()
    }

    onCustomWidgetResize (width, height) {
      this.render()
    }

    onCustomWidgetAfterUpdate (changedProps) {
      // console.log('onCustomWidgetAfterUpdateonCustomWidgetAfterUpdateonCustomWidgetAfterUpdate');
      this.render();
    }

    onCustomWidgetDestroy () {
      if (this._hotInstance) { 
        this._hotInstance.destroy(); 
      }
    };

    async render () {
      this.myCustomScale = Number(this.myCustomScale);
      let mycustomDecimalPlacesTmp = this.myCustomDecimalPlaces || 2;
      let mycustomUnitTmp = this.myCustomUnit || '';
      let mycustomScaleTmp = this.myCustomScale || 1;
      let myCustomThousandSeparatorTmp = this.myCustomThousandSeparator || 0;
      const isRowHeaderEnabled = this.myRowHeader === true || this.myRowHeader === 'true' || this.myRowHeader === undefined;
      const isColHeaderEnabled = this.myColHeader === true || this.myColHeader === 'true' || this.myColHeader === undefined;

      
      try {
        await loadCss('https://tomato-nana.github.io/Linnate.github.io/handsontable.full.min.css');
        await getScriptPromisify('https://tomato-nana.github.io/Linnate.github.io/handsontable.full.min.js');
        await getScriptPromisify('https://tomato-nana.github.io/Linnate.github.io/zh-CN.js');
        await getScriptPromisify('https://tomato-nana.github.io/Linnate.github.io/hyperformula.full.min.js');
        console.log('CSS and JS files loaded successfully');
        } catch (error) {
          console.log('render的try出错了');
          console.error(error.message);
        }

        let indentSettings = [];
        let percentageSettings = [];
        let insertData = '';
        let readOnlyCells = []; 
        let mergedCells = [];   // 用于记录被合并的单元格

        const saveReadOnlySettings = (row, col) => {
          const index = readOnlyCells.findIndex(item => item.row === row && item.col === col);
          if (index === -1) {
            readOnlyCells.push({ row, col });
          }
        };

        const removeReadOnlySettings = (row, col) => {
          const index = readOnlyCells.findIndex(item => item.row === row && item.col === col);
          if (index !== -1) {
            readOnlyCells.splice(index, 1);
          }
        };

        const dataBinding = this.dataBinding;
        if (!dataBinding || dataBinding.state !== 'success') {
          return;
        }

        const customFormatNumber = (value, options) => {
          const { decimalPlaces = 2, thousandSeparator = ',', decimalSeparator = '.' } = options;
        
          // 保留指定小数位
          const fixedValue = value.toFixed(decimalPlaces);
        
          // 分离整数部分和小数部分
          const [integerPart, decimalPart] = fixedValue.split('.');
        
          // 格式化整数部分，加入千分位分隔符
          const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);
        
          // 拼接结果
          return decimalPart
            ? formattedInteger + decimalSeparator + decimalPart
            : formattedInteger;
        }

        /**
         * 转化为百分数，向缩进存储一样，添加转换百分数的菜单，
         * 之后存储有哪些单元格需要转换成百分数（是number且需要转换百分数），之后再渲染
         * @param {*} value 
         * @param {*} decimalPlaces 
         * @param {*} unit 
         * @returns 
         */
        const formatPercentage = (value, decimalPlaces = 2, unit = '万') => {
          return (value * 100).toFixed(decimalPlaces) + '%';
        }

        const formatWithUnit = (value, options) => {
          const { 
            decimalPlaces = 2, 
            thousandSeparator = ',', 
            decimalSeparator = '.', 
            unit = '', // 默认无单位
            scale = 1
          } = options;
        
          // 动态单位处理
          let formattedValue = value;
          let selectedUnit = unit;

          formattedValue = value / scale;
        
          // if (!unit) { // 如果未指定单位，动态分配
          //   if (value >= 1e8) { // 亿
          //     formattedValue = value / 1e8;
          //     selectedUnit = '亿';
          //   } else if (value >= 1e4) { // 万
          //     formattedValue = value / 1e4;
          //     selectedUnit = '万';
          //   } else if (value >= 1e3) { // 千
          //     formattedValue = value / 1e3;
          //     selectedUnit = '千';
          //   }
          // }
        
          // 格式化数值
          const fixedValue = formattedValue.toFixed(decimalPlaces);
          const [integerPart, decimalPart] = fixedValue.split('.');
        
          const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);
          const result = decimalPart
            ? formattedInteger + decimalSeparator + decimalPart + selectedUnit
            : formattedInteger + selectedUnit;
        
          return result;
        }
        
        // // 示例用法
        // console.log(formatWithUnit(10000, { decimalPlaces: 2, thousandSeparator: ',', decimalSeparator: '.', unit: '' })); 
        // // 输出: 1.00万
        

        // console.log('dataBinding',dataBinding);

        const { data, metadata } = dataBinding;
        const { dimensions, measures } = parseMetadata(metadata);
        // console.log('dataBinding',dataBinding);

        // 生成初始数据和表头
        let baseTableData = data.map(row => {
            return dimensions.map(dim => row[dim.key]?.label || "").concat(
                measures.map(meas => row[meas.key]?.raw || "")
            );
        });

        // 定义初始表头
        let baseHeaders = dimensions.map(dimension => dimension.description).concat(
          measures.map(measure => measure.label)
        );

        // 拼接表头和数据
        let combinedTable = [baseHeaders, ...baseTableData];

        // 检查是否有缩进缓存
        if(this.myIndentSettings){
          console.log('***有缩进存储***', this.myIndentSettings);
          indentSettings = JSON.parse(this.myIndentSettings);
        }

        if(this.myPercentageSettings){
          console.log('***有百分数存储***', this.myPercentageSettings);
          percentageSettings = JSON.parse(this.myPercentageSettings);
        }

        let tableData = [];
        if (this.myInsertData) {
          console.log('***有插入数据存储***', this.myInsertData);
          tableData = this.applyInsertRecords(combinedTable);
        } else {
            tableData = combinedTable;
        }

        console.log('Final tableData:', tableData);

        if (this._hotInstance) {
          this._hotInstance.destroy();
        }

        // 创建Handsontable实例
        this._hotInstance = new Handsontable(this._root, {
          data: tableData,
          rowHeaders: isRowHeaderEnabled,
          colHeaders: isColHeaderEnabled,
          // autoColumnSize: true,
          persistentState: true,
          manualColumnResize: true,
          language: 'zh-CN', 
          formulas: {
            engine: HyperFormula // 使用 HyperFormula 作为公式解析器
          },
          dropdownMenu: true,
          mergeCells: true,
          contextMenu: true,
          licenseKey: 'non-commercial-and-evaluation',
          afterChange: this.afterChange.bind(this),
          afterCreateRow: this.afterCreateRow.bind(this),
          afterCreateCol: this.afterCreateCol.bind(this),
          afterRemoveRow: this.afterRemoveRow.bind(this),
          afterRemoveCol: this.afterRemoveCol.bind(this),
          afterUnmergeCells: this.afterUnmergeCells.bind(this),

          contextMenu: {
            callback: (key, options) => {
              console.log(`$$$Menu item '${key}' triggered`);
              // this._hotInstance.render();
            },
            items: {
              ...Handsontable.plugins.ContextMenu.DEFAULT_ITEMS, // 保留默认菜单项
              "increase_indent": {
                name: "缩进",
                callback: (_, selection) => {
                  const selected = selection[0]; // 获取选中区域
                  console.log('selectedselectedselectedselected',selected)
                  for (let row = selected.start.row; row <= selected.end.row; row++) {
                    for (let col = selected.start.col; col <= selected.end.col; col++) {
                      const cellMeta = this._hotInstance.getCellMeta(row, col);
                      cellMeta.indentLevel = (cellMeta.indentLevel || 0) + 1; // 增加缩进层级
                      this._hotInstance.setCellMeta(row, col, 'indentLevel', cellMeta.indentLevel);
    
                      // 更新缩进设置数组
                      const index = indentSettings.findIndex(item => item.row === row && item.col === col);
                      if (index === -1) {
                        indentSettings.push({ row, col, indentLevel: cellMeta.indentLevel });
                      } else {
                        indentSettings[index].indentLevel = cellMeta.indentLevel;
                      }
                    }
                  }
                  this.saveIndentSettings(JSON.stringify(indentSettings));
                  this._hotInstance.render(); // 重新渲染表格
                },
              },
              "decrease_indent": {
                name: "取消缩进",
                callback: (_, selection) => {
                  const selected = selection[0]; // 获取选中区域
                  for (let row = selected.start.row; row <= selected.end.row; row++) {
                    for (let col = selected.start.col; col <= selected.end.col; col++) {
                      const cellMeta = this._hotInstance.getCellMeta(row, col);
                      cellMeta.indentLevel = Math.max((cellMeta.indentLevel || 0) - 1, 0); // 减少缩进层级，不低于0
                      this._hotInstance.setCellMeta(row, col, 'indentLevel', cellMeta.indentLevel);
                      // 更新缩进设置数组
                      const index = indentSettings.findIndex(item => item.row === row && item.col === col);
                      if (index !== -1) {
                        if (cellMeta.indentLevel === 0) {
                          indentSettings.splice(index, 1); // 移除无缩进的单元格记录
                        } else {
                          indentSettings[index].indentLevel = cellMeta.indentLevel;
                        }
                      }
                    }
                  }
                  this.saveIndentSettings(JSON.stringify(indentSettings));
                  this._hotInstance.render(); // 重新渲染表格
                },
              },
              mergeCells:{},
              "set_percentage": {
                name: "设置为百分数",
                callback: (_, selection) => {
                  const selected = selection[0]; // 获取选中区域
                  for (let row = selected.start.row; row <= selected.end.row; row++) {
                    for (let col = selected.start.col; col <= selected.end.col; col++) {
                      const cellMeta = this._hotInstance.getCellMeta(row, col);
                      
                      // 设置百分数格式
                      const value = this._hotInstance.getDataAtCell(row, col);
                      const formattedValue = typeof value === 'number' ? (value * 100).toFixed(2) + '%' : value;

                      this._hotInstance.setDataAtCell(row, col, formattedValue);

                      // 记录哪些单元格被设置为百分数
                      const index = percentageSettings.findIndex(item => item.row === row && item.col === col);
                      if (index === -1) {
                        percentageSettings.push({ row, col, isPercentage: true });
                      } else {
                        percentageSettings[index].isPercentage = true;
                      }
                    }
                  }
                  this.savePercentageSettings(JSON.stringify(percentageSettings));
                  console.log('percentageSettings',percentageSettings);
                  console.log('this.myPercentageSettings',this.myPercentageSettings);
                  this._hotInstance.render(); // 重新渲染表格
                },
              },  
              "remove_percentage": {
                name: "取消百分数设置",
                callback: (_, selection) => {
                  const selected = selection[0]; // 获取选中区域
                  for (let row = selected.start.row; row <= selected.end.row; row++) {
                    for (let col = selected.start.col; col <= selected.end.col; col++) {
                      const cellMeta = this._hotInstance.getCellMeta(row, col);
                      
                      // 恢复为原始格式（移除百分数）
                      const value = this._hotInstance.getDataAtCell(row, col);
                      const formattedValue = value && value.includes('%') ? parseFloat(value.replace('%', '')) / 100 : value;

                      this._hotInstance.setDataAtCell(row, col, formattedValue);

                      // 移除百分数设置的记录
                      const index = percentageSettings.findIndex(item => item.row === row && item.col === col);
                      if (index !== -1) {
                        percentageSettings.splice(index, 1); // 移除百分数设置的单元格记录
                      }
                    }
                  }
                  this.savePercentageSettings(JSON.stringify(percentageSettings));
                  this._hotInstance.render(); // 重新渲染表格
                },
              },
            }
          },
          cells: function (row, col) {
            const cellProperties = {};
              // 检查是否是只读单元格
            const isReadOnly = readOnlyCells.some(item => item.row === row && item.col === col);
            if (isReadOnly) {
              cellProperties.readOnly = true; // 设置只读属性
            }
            // // 为第一行设置加粗字体
            // if (row === 0) {
            //   cellProperties.renderer = function (instance, td, row, col, prop, value, cellProperties) {
            //     Handsontable.renderers.TextRenderer.apply(this, arguments);
            //     td.style.fontWeight = 'bold'; // 设置字体加粗
            //   };
            // } 
            
            // cellProperties.renderer = indentRenderer; // 使用原有渲染器
            cellProperties.renderer = function (instance, td, row, col, prop, value, cellProperties) {
              Handsontable.renderers.TextRenderer.apply(this, arguments);

              // 判断是否是百分数设置
              const percentageSetting = percentageSettings.find(item => item.row === row && item.col === col);
              if (percentageSetting) {
                // 如果是百分数设置，进行百分数格式化
                if (typeof value === 'number') {
                    const formattedValue = (value * 100).toFixed(2) + '%'; // 转换为百分数格式
                    td.textContent = formattedValue;
                    td.style.color = 'green'; // 设置百分数的样式（例如绿色）
                }
              } else if (typeof value === 'number') {
              // 如果不是百分数设置，按照源代码逻辑格式化数值

              //   // 判断是否是数值类型
              //   if (typeof value === 'number') {
                let formattedValue;

                // !important!!!这里要写几个if判断和styling联动，是否设置百分数，保留几位小数 见formatPercentage（）方法
                // 默认单位是个，设置个十百千万百万，见formatUnit（）方法

                if (myCustomThousandSeparatorTmp === 1 || myCustomThousandSeparatorTmp === '1'){ 
                  //12,345.67
                  formattedValue = formatWithUnit(value, {
                    decimalPlaces: mycustomDecimalPlacesTmp,
                    thousandSeparator: ',', 
                    decimalSeparator: '.' ,
                    unit: mycustomUnitTmp,
                    scale: mycustomScaleTmp
                  });
                  // console.log("formattedValueformattedValueformattedValue",formattedValue);
                }else if(myCustomThousandSeparatorTmp === 2 || myCustomThousandSeparatorTmp === '2'){
                  //12.345,67
                  formattedValue = formatWithUnit(value, {
                    decimalPlaces: mycustomDecimalPlacesTmp,
                    thousandSeparator: '.', 
                    decimalSeparator: ',' ,
                    unit: mycustomUnitTmp,
                    scale: mycustomScaleTmp
                  });
                } else if(myCustomThousandSeparatorTmp === 3 || myCustomThousandSeparatorTmp === '3'){
                  //12 345.67
                  formattedValue = formatWithUnit(value, {
                    decimalPlaces: mycustomDecimalPlacesTmp,
                    thousandSeparator: ' ', 
                    decimalSeparator: '.' ,
                    unit: mycustomUnitTmp,
                    scale: mycustomScaleTmp
                  });
                } else{
                  //12345.67
                  formattedValue = formatWithUnit(value, {
                    decimalPlaces: mycustomDecimalPlacesTmp,
                    thousandSeparator: '', 
                    decimalSeparator: '.' ,
                    unit: mycustomUnitTmp,
                    scale: mycustomScaleTmp
                  });
                }
                
                td.style.color = 'blue'; // 设置公式结果的样式

                // 更新单元格显示值
                td.textContent = formattedValue;
              }

              // 为第一行设置加粗字体
              if (row === 0) {
                  td.style.fontWeight = 'bold'; // 设置字体加粗
              } 
        
              // 如果有缩进级别，应用缩进样式
              if (cellProperties.indentLevel) {
                td.style.paddingLeft = `${cellProperties.indentLevel * 10}px`;
              } 
            }

            // const cell = indentSettings.find(item => item.row === row && item.col === col);
            // if (cell) {
            //   cellProperties.indentLevel = cell.indentLevel; // 加载存储的缩进级别
            // }
            // cellProperties.renderer = indentRenderer; // 使用自定义渲染器
            // cellProperties.renderer = combinedRenderer; // 使用自定义渲染器

            return cellProperties;
          }
        });

        // // 加载列宽
        // const savedWidths = this._hotInstance.getPlugin('manualColumnResize').loadManualColumnWidths();
        // if (savedWidths.length) {
        //   this._hotInstance.setColumnWidths(savedWidths);
        // }

        // this._hotInstance.render();
        // console.log('!!!!!!!!!!!',this.myMergeData);
        this.loadMergeCells();
        // 初始化时应用存储的缩进设置
        indentSettings.forEach(item => {
          const cellMeta = this._hotInstance.getCellMeta(item.row, item.col);
          cellMeta.indentLevel = item.indentLevel;
          this._hotInstance.setCellMeta(item.row, item.col, 'indentLevel', item.indentLevel);
        });

        this._hotInstance.render();

    }

    savemyInsertData(insertData) {
        this.myInsertData = insertData;
        const myInsertData = insertData;
        this.dispatchEvent(new CustomEvent('propertiesChanged', { detail: { properties: { myInsertData } } }))
    };

    savemyMergeData(mergeData) {
        this.myMergeData = mergeData;
        const myMergeData = mergeData;
        this.dispatchEvent(new CustomEvent('propertiesChanged', { detail: { properties: { myMergeData } } }))
    };

    saveIndentSettings(indentSettings) {
      this.myIndentSettings = indentSettings;
      const myIndentSettings = indentSettings;
      this.dispatchEvent(new CustomEvent('propertiesChanged', { detail: { properties: { myIndentSettings } } }))
    };

    saveAlignmentSettings(alignmentSettings) {
      this.myAlignmentSettings = alignmentSettings;
      const myAlignmentSettings = alignmentSettings;
      this.dispatchEvent(new CustomEvent('propertiesChanged', { detail: { properties: { myAlignmentSettings } } }))
    };

    savePercentageSettings(percentageSettings) {
      this.myPercentageSettings = percentageSettings;
      const myPercentageSettings = percentageSettings;
      this.dispatchEvent(new CustomEvent('propertiesChanged', { detail: { properties: { myPercentageSettings } } }))
    }


    saveMergeCells() {
      // 在保存之前，检查是否处于加载状态
      if (this.isLoadingMergeCells) {
        console.log('Skipping saveMergeCells during load.');
        return;
      }
      // const mergeCells = this._hotInstance.getMergeCells();
      const mergePlugin = this._hotInstance.getPlugin('mergeCells');
  
      if (!mergePlugin) {
        console.error('MergeCells plugin is not enabled.');
        return;
      }
      const myMergeData = mergePlugin.mergedCellsCollection.mergedCells.map(cell => ({
        row: cell.row,
        col: cell.col,
        rowspan: cell.rowspan,
        colspan: cell.colspan,
      }));
      this.savemyMergeData(JSON.stringify(myMergeData));
      // console.log('$$$$$$$$$$myMergeData', myMergeData);
      // this.dispatchEvent(new CustomEvent('propertiesChanged', { detail: { properties: { myMergeData } } }))
    }

    loadMergeCells() {
      const myMergeData = JSON.parse(this.myMergeData || '[]');
      console.log('_____loadMergeCells',myMergeData);
      if (myMergeData.length === 0) {
        console.log('No merge cell data in cache.');
        return;
      }
      // myMergeData.forEach(cell => {
      //   this._hotInstance.setCellMeta(cell.row, cell.col, 'merge', [cell.rowspan, cell.colspan]);
      // });
      const mergeCellsConfig = myMergeData.map((merge) => ({
        row: merge.row,
        col: merge.col,
        rowspan: merge.rowspan,
        colspan: merge.colspan,
      }));

      // 标记正在加载状态
      this.isLoadingMergeCells = true;

      this._hotInstance.updateSettings({ mergeCells: mergeCellsConfig });

      // console.log('Loaded merge cells from cache:', mergeCellsConfig);

      // 恢复标记状态
      this.isLoadingMergeCells = false;
    
      // // 使用 Handsontable 的设置更新 mergeCells 配置
      // this._hotInstance.updateSettings({ mergeCells: mergeCellsConfig });
      // console.log('Loaded merge cells from cache:', mergeCellsConfig);
    }

    removeMergeCell(row, col) {
      // 从缓存中获取当前合并单元格数据
      let mergeCells = JSON.parse(this.myMergeData || '[]');
  
      // 过滤掉与取消合并单元格匹配的记录
      mergeCells = mergeCells.filter(cell => !(cell.row === row && cell.col === col));
  
      // 更新缓存
      this.savemyMergeData(JSON.stringify(mergeCells));
  
      // console.log('Removed merge cell from cache:', { row, col });
    }
  
    afterUnmergeCells(cellRange) {
      // 获取取消合并单元格的起始行和列
      const { from: { row, col } } = cellRange;
  
      // 调用 removeMergeCell 方法
      this.removeMergeCell(row, col);
    }
    
    /***！！！AAA这里合并完单元格重新render的时候会出错，执行的先后顺序很有问题，这里也要仔细排查一下
     * AAA合并单元格之后要对应更新this.myInsertData
    ***/
    applyInsertRecords(baseTableData) {
        let modifiedData = [...baseTableData];
        let myInsert = JSON.parse(this.myInsertData || '[]'); // 防止空数据抛出错误

        // 初始化行插入和列插入的结果集
        let rowInserts = [];
        let colInserts = [];

        // 分类存储行和列插入记录
        myInsert.forEach(record => {
          if (record.type === 'row') {
              rowInserts.push(record);
          } else if (record.type === 'col') {
              colInserts.push(record);
          }
        });

        // 按行插入记录的索引升序排序，确保插入顺序正确
        rowInserts.sort((a, b) => a.index - b.index);
        colInserts.sort((a, b) => a.index - b.index);

        // console.log('###rowInserts',rowInserts);
        // console.log('###colInserts',colInserts);

        // 应用新增行记录
        rowInserts.forEach(record => {
          // console.log('modifiedData2222222222',modifiedData);
          const rowIndex = record.index;
          const rowValues = record.value || [];

          // 初始化行，确保新增的行具有与现有列数一致的长度
          const newRow = Array(modifiedData[0].length).fill('');
          rowValues.forEach((value, colIndex) => {
              newRow[colIndex] = value; // 填充值
          });

          // 插入到指定位置
          modifiedData.splice(rowIndex, 0, newRow);
        });

        // 应用新增列记录
        colInserts.forEach(record => {
          // console.log('modifiedData1111111111',modifiedData);
          const colIndex = record.index;
          const colValues = record.value || []; // 获取列值或初始化为空数组

          // 更新每一行，确保新增列值与行数匹配
          modifiedData.forEach((row, rowIndex) => {
              const value = colValues[rowIndex] || ''; // 如果列值未定义，则使用空字符串
              if(row.length < rowInserts[0].value.length){ //避免插入的行的列数溢出
                row.splice(colIndex, 0, value);
              }
          });

        });

        return modifiedData;
    }

    //***(completed)如果是中间插入的话，其后面所有的index都要跟着改变*** */
    afterCreateRow(index, amount) {
        // console.log('@@@index',index);
        let myInsert = [];
        if(JSON.parse(this.myInsertData).length !== 0){
          myInsert = JSON.parse(this.myInsertData);
        }

        // 获取当前列数
        const columnCount = this._hotInstance.countCols();

         // 更新已存在的行索引值，确保插入点之后的索引值加1
        myInsert = myInsert.map(item => {
          if (item.index >= index) {
              return {
                  ...item,
                  index: item.index + amount
              };
          }
          return item;
        });

        for (let i = 0; i < amount; i++) {
          // myInsert.push({ type: 'row', index: index + i, value: [] });
          myInsert.push({ type: 'row', index: index + i, value: Array(columnCount).fill('') });
          // Update existing column values for the newly inserted row（AAA下面的注释记得改过来！！！）
          myInsert.filter(record => record.type === 'col').forEach(record => {
            record.value.splice(index + i, 0, ''); // Insert 'col' in the new row for each column
          });
        }

        // !!!更新合并单元格数据
        let mergeCells = JSON.parse(this.myMergeData || '[]');

        mergeCells = mergeCells.map(cell => {
            if (cell.row >= index) {
                // 如果插入点在 cell.row 之前，更新 row 值
                return {
                    ...cell,
                    row: cell.row + amount
                };
            } else if (cell.row < index && cell.row + cell.rowspan > index) {
                // 如果插入点在单元格内部，增加 rowspan
                return {
                    ...cell,
                    rowspan: cell.rowspan + amount
                };
            }
            return cell;
        });

        let myIndentSettings = JSON.parse(this.myIndentSettings || '[]');
        // 更新缩进信息，增加行时需要调整行索引
        myIndentSettings.forEach(item => {
            if (item.row >= index) {
                item.row += amount; // 调整新增行后面的行索引
            }
        });
        // 初始化新增行的缩进信息
        for (let i = 0; i < amount; i++) {
            for (let col = 0; col < columnCount; col++) {
                const newRowIndex = index + i;
                this._hotInstance.setCellMeta(newRowIndex, col, 'indentLevel', 0);
            }
        }
        this.saveIndentSettings(JSON.stringify(myIndentSettings));

        //更新百分号设置
        let myPercentageSettings = JSON.parse(this.myPercentageSettings || '[]');
        myPercentageSettings.forEach(item => {
          if (item.row >= index) {
              item.row += amount; // 调整新增行后面的行索引
          }
        });
        this.savePercentageSettings(JSON.stringify(myPercentageSettings));


        // 保存更新后的合并单元格数据
        this.savemyInsertData(JSON.stringify(myInsert));
        this.savemyMergeData(JSON.stringify(mergeCells));
        // console.log('@@@afterCreateRow之后的 insertData:', this.myInsertData);
        this.render();
        
    }

    //***(completed)如果是中间插入的话，其右边所有的index都要跟着改变*** */
    afterCreateCol(index, amount) {
        let myInsert = [];
        if(JSON.parse(this.myInsertData).length !== 0){
          myInsert = JSON.parse(this.myInsertData);
        }

         // 更新已存在的列索引，确保插入点之后的索引值加1
        myInsert = myInsert.map(record => {
          if (record.type === 'col' && record.index >= index) {
              return {
                  ...record,
                  index: record.index + amount
              };
          }
          return record;
        });

        // 添加列记录，并生成默认列名
        for (let i = 0; i < amount; i++) {
          myInsert.push({
              type: 'col',
              index: index + i,
              value: Array(this._hotInstance.countRows()).fill(''),
              // header: `New Column ${index + i + 1}` // 默认列名
          });
        }

        // 更新现有的行记录以适应新增的列
        myInsert.filter(record => record.type === 'row').forEach(record => {
          for (let i = 0; i < amount; i++) {
              record.value.splice(index, 0, ''); // 在新增列的位置插入空单元格
          }
        });

        // !!!更新合并单元格数据
        let mergeCells = JSON.parse(this.myMergeData || '[]');

        mergeCells = mergeCells.map(cell => {
            if (cell.col >= index) {
                return { ...cell, col: cell.col + amount };
            } else if (cell.col < index && cell.col + cell.colspan > index) {
                return { ...cell, colspan: cell.colspan + amount };
            }
            return cell;
        });

        let myIndentSettings = JSON.parse(this.myIndentSettings || '[]');
        // 更新缩进信息，增加列时需要调整列索引
        myIndentSettings.forEach(item => {
          if (item.col >= index) {
              item.col += amount; // 调整新增列后面的列索引
          }
        });
        // 初始化新增列的缩进信息
        for (let i = 0; i < amount; i++) {
            const newCol = index + i;
            for (let row = 0; row < this._hotInstance.countRows(); row++) {
                this._hotInstance.setCellMeta(row, newCol, 'indentLevel', 0);
            }
        }
        this.saveIndentSettings(JSON.stringify(myIndentSettings));

        //更新百分号设置
        let myPercentageSettings = JSON.parse(this.myPercentageSettings || '[]');
        myPercentageSettings.forEach(item => {
          if (item.col >= index) {
            item.col += amount; // 调整新增列后面的列索引
          }
        });
        this.savePercentageSettings(JSON.stringify(myPercentageSettings));

        // this.myInsertData = myInsert;
        this.savemyInsertData(JSON.stringify(myInsert));
        this.savemyMergeData(JSON.stringify(mergeCells));
        this.render();
        // console.log('@@@afterCreateCol之后的 insertData:', this.myInsertData);
    }

     /***(completed)删除时候，其下边所有的index都要跟着改变***
     * 现在删除多行的时候，对应列的位置的元素删除有些问题
     * */
    afterRemoveRow(index, amount) {
        let myInsert = [];
        if (this.myInsertData) {
            myInsert = JSON.parse(this.myInsertData);
        }

        // 移除行记录
        for (let i = 0; i < amount; i++) {
          const removedIndex = index + i;

          // 从 `myInsert` 中移除与删除行相关的记录
          myInsert = myInsert.filter(
              item => !(item.type === 'row' && item.index === removedIndex)
          );
          
          // // 从每列记录中移除与删除行相关的数据
          // myInsert.forEach(item => {
          //   if (item.type === 'col' && item.value) {
          //       item.value.splice(removedIndex, 1); // 移除对应行的数据
          //   }
          // });
        }

        // 调整剩余行记录的索引
        myInsert.forEach(item => {
          if (item.type === 'row' && item.index >= index) {
              item.index -= amount; // 删除多行时，索引减少对应数量
          }

          // 从每列记录中移除与删除行相关的数据
          if (item.type === 'col' && item.value) {
              item.value.splice(index, amount); // 移除对应列的数据
          }
        });

        //!!!更新合并单元格

        let mergeCells = JSON.parse(this.myMergeData || '[]');

        mergeCells = mergeCells.filter(cell => cell.row + cell.rowspan <= index || cell.row >= index + amount);
    
        mergeCells = mergeCells.map(cell => {
            if (cell.row >= index + amount) {
                return { ...cell, row: cell.row - amount };
            } else if (cell.row < index && cell.row + cell.rowspan > index) {
                return { ...cell, rowspan: cell.rowspan - amount };
            }
            return cell;
        });

        let myIndentSettings = JSON.parse(this.myIndentSettings || '[]');
        // 移除被删除行的缩进信息
        myIndentSettings = myIndentSettings.filter(item => item.row < index || item.row >= index + amount);

        // 调整剩余行的缩进索引
        myIndentSettings.forEach(item => {
            if (item.row >= index + amount) {
                item.row -= amount;
            }
        });

        // 移除被删除行的百分号设置
        let myPercentageSettings = JSON.parse(this.myPercentageSettings || '[]');
        myPercentageSettings = myPercentageSettings.filter(item => item.row < index || item.row >= index + amount);
        myPercentageSettings.forEach(item => {
            if (item.row >= index + amount) {
                item.row -= amount;
            }
        });

        this.savePercentageSettings(JSON.stringify(myPercentageSettings));
        this.saveIndentSettings(JSON.stringify(myIndentSettings));
        this.savemyInsertData(JSON.stringify(myInsert));
        this.savemyMergeData(JSON.stringify(mergeCells));
        this.render();
    }
    
     //***(completed)删除时候，其右边所有的index都要跟着改变*** */
    afterRemoveCol(index, amount) {
        let myInsert = [];
        if (this.myInsertData) {
            myInsert = JSON.parse(this.myInsertData);
        }
    
        // // 更新表头
        // let updatedHeaders = this._hotInstance.getSettings().colHeaders;
        // updatedHeaders.splice(index, amount); // 移除对应的列头
    
        // 移除列记录
        for (let i = 0; i < amount; i++) {
            const removedIndex = index + i;
    
            // 从 `myInsert` 中移除与删除列相关的记录
            myInsert = myInsert.filter(
                item => !(item.type === 'col' && item.index === removedIndex)
            );
    
            // // 调整剩余列记录的索引（列号减少）
            // myInsert.forEach(item => {
            //     if (item.type === 'col' && item.index > removedIndex) {
            //         item.index -= 1;
            //     }
            // });
        }

        // 调整剩余列记录的索引
        myInsert.forEach(item => {
            if (item.type === 'col' && item.index >= index) {
                item.index -= amount; // 删除多列时，索引减少对应数量
            }

            // 从每行记录中移除与删除列相关的数据
            if (item.type === 'row' && item.value) {
                item.value.splice(index, amount); // 移除对应列的数据
            }
        });
    
        // // 更新表头设置
        // this._hotInstance.updateSettings({
        //     colHeaders: updatedHeaders
        // });

        //！！！更新合并单元格
        let mergeCells = JSON.parse(this.myMergeData || '[]');

        mergeCells = mergeCells.filter(cell => cell.col + cell.colspan <= index || cell.col >= index + amount);
    
        mergeCells = mergeCells.map(cell => {
            if (cell.col >= index + amount) {
                return { ...cell, col: cell.col - amount };
            } else if (cell.col < index && cell.col + cell.colspan > index) {
                return { ...cell, colspan: cell.colspan - amount };
            }
            return cell;
        });

        let myIndentSettings = JSON.parse(this.myIndentSettings || '[]');
        // 移除被删除行的缩进信息
        myIndentSettings = myIndentSettings.filter(item => item.col < index || item.col >= index + amount);

        // 调整剩余行的缩进索引
        myIndentSettings.forEach(item => {
            if (item.col >= index + amount) {
                item.col -= amount;
            }
        });

        // 移除被删除列的百分号设置
        let myPercentageSettings = JSON.parse(this.myPercentageSettings || '[]');
        myPercentageSettings = myPercentageSettings.filter(item => item.col < index || item.col >= index + amount);
        myPercentageSettings.forEach(item => {
            if (item.col >= index + amount) {
                item.col -= amount;
            }
        });

        this.savePercentageSettings(JSON.stringify(myPercentageSettings));
        this.saveIndentSettings(JSON.stringify(myIndentSettings));
        this.savemyInsertData(JSON.stringify(myInsert));
        this.savemyMergeData(JSON.stringify(mergeCells));
        this.render();
    }
  

    afterChange(changes, source) {
        // console.log('Changes:', changes);
        // console.log('Source:', source);
        if (source === 'loadData') {
            return;
        }
    
        let myInsert = [];
        if(this.myInsertData){
          myInsert = JSON.parse(this.myInsertData);
        }
        changes.forEach(([row, col, oldValue, newValue]) => {
            // 检查是否是行记录
            const record = myInsert.find(item => item.type === 'row' && item.index === row);
            if (record) {
                record.value[col] = newValue;
            }
            // 检查是否是列记录
            const colRecord = myInsert.find(item => item.type === 'col' && item.index === col);
            if (colRecord) {
                if (!colRecord.value) {
                    colRecord.value = [];
                }
                colRecord.value[row] = newValue;
            }
        });

        this.savemyInsertData(JSON.stringify(myInsert));
        this.saveMergeCells();
        // console.log('@@@afterChange之后的 insertData:', this.myInsertData);
    }

  }

  customElements.define('com-sap-sample-handsontable-prepared', SamplePrepared)
})()
