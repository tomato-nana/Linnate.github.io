(function () {
    const template = document.createElement('template')
    template.innerHTML = `
      <style>
        #root label {
          height: 24px;
          display: block;
          font-size: .875rem;
          color: #999;
        }
        #root label {
          margin-top: 16px;
        }
        #root select {
          font-size: 14px;
          width: 120px;
        }
        #root button {
          display: block;
          margin-top: 16px;
        }
        #root strong {
          white-space: normal;
          margin-top: 16px;
        }
      </style>
      <div id="root" style="width: 100%; height: 100%;">
        <div id="atteintion">
            <strong>Please confirm the model, measures, and dimensions before editing the table. Any changes in Builder panel will reset all your change to the default status.</strong>
        <div id="myCustomUnit">
            <label for="myCustomUnit-input">单位</label>
            <input id="myCustomUnit-input" style="width: 70%; height: 100%;" placeholder="请输入自定义单位名称"/>
        </div>
        <div id="myCustomScale">
            <label for="myCustomScale-input">倍数</label>
            <input id="myCustomScale-input" style="width: 70%; height: 100%;" placeholder="请输入倍数"/>
        </div>
        <div id="myCustomDecimalPlaces">
            <label for="myCustomDecimalPlaces-dropdown">请选择保留几位小数</label>
            <select id="myCustomDecimalPlaces-dropdown" style="width: 50%; height: 100%;">
              <option value=0>0</option>
              <option value=1>1</option>
              <option value=2>2</option>
              <option value=3>3</option>
              <option value=4>4</option>
            </select>
        </div>
        <div id="myCustomThousandSeparator">
            <label for="myCustomThousandSeparator-dropdown">请选择数据格式</label>
            <select id="myCustomThousandSeparator-dropdown" style="width: 50%; height: 100%;">
              <option value=1>12,345.67</option>
              <option value=2>12.345,67</option>
              <option value=3>12 345.67</option>
            </select>
        </div>
        <div id="myIndentSettings">
            <label for="myIndentSettings-input">缩进设置(readonly)</label>
            <input id="myIndentSettings-input" type="text" style="width: 70%; height: 100%;" readonly/>
        </div>
        <div id="myInsertData">
            <label for="myInsertData-input">自定义插入数据(readonly)</label>
            <input id="myInsertData-input" style="width: 70%; height: 100%;" readonly/>
        </div>
        <div id="myMergeData">
            <label for="myMergeData-input">合并单元格数据(readonly)</label>
            <input id="myMergeData-input" style="width: 70%; height: 100%;" readonly/>
        </div>
        <div id="myRowHeader">
            <label for="myRowHeader-dropdown">行头</label>
            <select id="myRowHeader-dropdown" style="width: 50%; height: 100%;">
              <option value=true>开</option>
              <option value=false>关</option>
            </select>
        </div>
        <div id="myColHeader">
            <label for="myColHeader-dropdown">列头</label>
            <select id="myColHeader-dropdown" style="width: 50%; height: 100%;">
              <option value=true>开</option>
              <option value=false>关</option>
            </select>
        </div>
        <div id="myContextMenu" style="display: none;">
            <label for="myContextMenu-dropdown">myContextMenu</label>
            <select id="myContextMenu-dropdown" style="width: 50%; height: 100%;">
              <option value=true>开</option>
              <option value=false>关</option>
            </select>
        </div>
        <button id="button">Apply</button>
      </div>
      `
  
    class Styling extends HTMLElement {
      constructor () {
        super()
  
        this._shadowRoot = this.attachShadow({ mode: 'open' })
        this._shadowRoot.appendChild(template.content.cloneNode(true))
        this._root = this._shadowRoot.getElementById('root')
  
        this._button = this._shadowRoot.getElementById('button')
        this._button.addEventListener('click', () => {
          const myContextMenu = this._shadowRoot.getElementById('myContextMenu-dropdown').value;
          const myRowHeader = this._shadowRoot.getElementById('myRowHeader-dropdown').value;
          const myColHeader = this._shadowRoot.getElementById('myColHeader-dropdown').value;
          const myIndentSettings = this._shadowRoot.getElementById('myIndentSettings-input').value;
          const myInsertData = this._shadowRoot.getElementById('myInsertData-input').value;
          const myMergeData = this._shadowRoot.getElementById('myMergeData-input').value;
          const myCustomUnit = this._shadowRoot.getElementById('myCustomUnit-input').value;
          const myCustomScale = this._shadowRoot.getElementById('myCustomScale-input').value;
          const myCustomDecimalPlaces = this._shadowRoot.getElementById('myCustomDecimalPlaces-dropdown').value;
          const myCustomThousandSeparator = this._shadowRoot.getElementById('myCustomThousandSeparator-dropdown').value;
          this.dispatchEvent(new CustomEvent('propertiesChanged', { detail: { 
            properties: { 
              myContextMenu, 
              myIndentSettings, 
              myInsertData, 
              myMergeData,
              myCustomUnit,
              myCustomScale,
              myCustomDecimalPlaces,
              myCustomThousandSeparator,
              myRowHeader,
              myColHeader
            } } }));
          // console.log('按钮被点击了--myCustomUnit',myCustomUnit);
          // console.log('按钮被点击了--myCustomScale',myCustomScale);
          // console.log('按钮被点击了--myCustomDecimalPlaces',myCustomDecimalPlaces);
          // console.log('按钮被点击了--myCustomThousandSeparator',myCustomThousandSeparator);
          console.log('按钮被点击了--myRowHeader',myRowHeader);
          console.log('按钮被点击了--myColHeader',myColHeader);
        })
      }
  
      async onCustomWidgetAfterUpdate (changedProps) {
        if (changedProps.myIndentSettings) {
          const myIndentSettings = changedProps.myIndentSettings;
          this._shadowRoot.getElementById('myIndentSettings-input').value = changedProps.myIndentSettings;
          // console.log('onCustomWidgetAfterUpdate---myIndentSettings',myIndentSettings);
        };

        if (changedProps.myInsertData) {
          const myInsertData = changedProps.myInsertData;
          this._shadowRoot.getElementById('myInsertData-input').value = changedProps.myInsertData;
          // console.log('onCustomWidgetAfterUpdate---myInsertData',myInsertData);
        };

        if (changedProps.myMergeData) {
          const myMergeData = changedProps.myMergeData;
          this._shadowRoot.getElementById('myMergeData-input').value = changedProps.myMergeData;
          // console.log('onCustomWidgetAfterUpdate---myMergeData',myMergeData);
        };

        if (changedProps.myCustomUnit) {
          const myCustomUnit = changedProps.myCustomUnit;
          this._shadowRoot.getElementById('myCustomUnit-input').value = changedProps.myCustomUnit;
          // console.log('onCustomWidgetAfterUpdate---myCustomUnit',myCustomUnit);
        };

        if (changedProps.myCustomScale) {
          const myCustomScale = changedProps.myCustomScale;
          this._shadowRoot.getElementById('myCustomScale-input').value = changedProps.myCustomScale;
          // console.log('onCustomWidgetAfterUpdate---myCustomScale',myCustomScale);
        };

        if (changedProps.myCustomDecimalPlaces !== undefined && changedProps.myCustomDecimalPlaces !== null && changedProps.myCustomDecimalPlaces !== '') {
          let myCustomDecimalPlaces = changedProps.myCustomDecimalPlaces;
          this._shadowRoot.getElementById('myCustomDecimalPlaces-dropdown').value = myCustomDecimalPlaces;
          console.log('onCustomWidgetAfterUpdate---myCustomDecimalPlaces-if',myCustomDecimalPlaces);
        } else {
          let myCustomDecimalPlaces = 2;
          this._shadowRoot.getElementById('myCustomDecimalPlaces-dropdown').value = myCustomDecimalPlaces;
          console.log('onCustomWidgetAfterUpdate---myCustomDecimalPlaces-else',myCustomDecimalPlaces);
        };

        if (changedProps.myCustomThousandSeparator !== undefined && changedProps.myCustomThousandSeparator !== null && changedProps.myCustomThousandSeparator !== '') {
          let myCustomThousandSeparator = changedProps.myCustomThousandSeparator;
          this._shadowRoot.getElementById('myCustomThousandSeparator-dropdown').value = myCustomThousandSeparator;
          console.log('onCustomWidgetAfterUpdate---myCustomThousandSeparator-if',myCustomThousandSeparator);
        } else {
          let myCustomThousandSeparator = 0;
          this._shadowRoot.getElementById('myCustomThousandSeparator-dropdown').value = myCustomThousandSeparator;
          console.log('onCustomWidgetAfterUpdate---myCustomThousandSeparator-else',myCustomThousandSeparator);
        };

        if (changedProps.myRowHeader !== undefined && changedProps.myRowHeader !== null && changedProps.myRowHeader !== '') {
          let myRowHeader = changedProps.myRowHeader;
          this._shadowRoot.getElementById('myRowHeader-dropdown').value = myRowHeader;
          console.log('onCustomWidgetAfterUpdate---myRowHeader-if',myRowHeader);
        } else {
          let myRowHeader = true;
          this._shadowRoot.getElementById('myRowHeader-dropdown').value = myRowHeader;
          console.log('onCustomWidgetAfterUpdate---myRowHeader-else',myRowHeader);
        };

        if (changedProps.myColHeader !== undefined && changedProps.myColHeader !== null && changedProps.myColHeader !== '') {
          let myColHeader = changedProps.myColHeader;
          this._shadowRoot.getElementById('myColHeader-dropdown').value = myColHeader;
          console.log('onCustomWidgetAfterUpdate---myColHeader-if',myColHeader);
        } else {
          let myColHeader = true;
          this._shadowRoot.getElementById('myColHeader-dropdown').value = myColHeader;
          console.log('onCustomWidgetAfterUpdate---myColHeader-else',myColHeader);
        };

      }
    }
  
    customElements.define('com-sap-sac-exercise-table-styling', Styling)
  })()
  
  