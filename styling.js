(function () {
    const template = document.createElement('template')
    template.innerHTML = `
      <style>
        #root label {
          height: 24px;
          display: block;
          font-size: .875rem;
          color: #999;
          margin-top: 16px;
        }
        #root input, #root select {
          width: 100%;
          height: 80px;
          border: 1px solid #666;
          padding: 3px 5px;
          box-sizing: border-box;
        }
        #root button {
          display: block;
          width: 50px;
          height: 30px;
          background-color:rgb(228, 129, 63);
          color: #fff;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          margin-top: 20px;
        }
        #root button:hover {
          background-color:rgb(218, 80, 17);
        }
        #root strong {
          color: #666;
          white-space: normal;
          margin-top: 16px;
          display: block;
        }
        #root h4 {
          font-size: 18px;
          color: #333;
          margin-bottom: 10px;
        }
      </style>
      <div id="root" style="width: 100%; height: 100%;">
        <div id="atteintion">
              <strong>Please confirm the model, measures, and dimensions before editing the table. Any changes in Builder panel will reset all your change to the default status.</strong>
        </div>
        <div>
          <h4>数据格式设置</h4>
          <div id="myCustomThousandSeparator">
              <label for="myCustomThousandSeparator-dropdown">数据格式</label>
              <select id="myCustomThousandSeparator-dropdown" style="width: 50%; height: 100%;">
                <option value=1>12,345.67</option>
                <option value=2>12.345,67</option>
                <option value=3>12 345.67</option>
                <option value=100>原始格式</option>
              </select>
          </div>
          <div id="myCustomUnit">
              <label for="myCustomUnit-input">单位</label>
              <input id="myCustomUnit-input" style="width: 70%; height: 100%;" placeholder="请输入自定义单位名称"/>
          </div>
          <div id="myCustomScale">
              <label for="myCustomScale-input">数级</label>
              <input id="myCustomScale-input" style="width: 70%; height: 100%;" placeholder="请输入整数"/>
          </div>
          <div id="myCustomDecimalPlaces">
              <label for="myCustomDecimalPlaces-dropdown">小数位数</label>
              <select id="myCustomDecimalPlaces-dropdown" style="width: 50%; height: 100%;">
                <option value=0>0</option>
                <option value=1>1</option>
                <option value=2>2</option>
                <option value=3>3</option>
                <option value=4>4</option>
                <option value=5>5</option>
                <option value=6>6</option>
                <option value=7>7</option>
              </select>
          </div>
        </div>
        <div>
          <h4>行/列标题</h4>
          <div id="myRowHeader">
              <label for="myRowHeader-dropdown">行标题</label>
              <select id="myRowHeader-dropdown" style="width: 50%; height: 100%;">
                <option value=true>开</option>
                <option value=false>关</option>
              </select>
          </div>
          <div id="myColHeader">
              <label for="myColHeader-dropdown">列标题</label>
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
        </div>
        <div>
          <h4>自定义格式</h4>
          <div id="myInsertData">
              <label for="myInsertData-input">自定义新增数据(readonly)</label>
              <input id="myInsertData-input" style="width: 70%; height: 100%;" readonly/>
          </div>
          <div id="myIndentSettings">
              <label for="myIndentSettings-input">缩进数据(readonly)</label>
              <input id="myIndentSettings-input" type="text" style="width: 70%; height: 100%;" readonly/>
          </div>
          <div id="myMergeData">
              <label for="myMergeData-input">合并单元格数据(readonly)</label>
              <input id="myMergeData-input" style="width: 70%; height: 100%;" readonly/>
          </div>
          <div id="myPercentageSettings">
              <label for="myPercentageSettings-input">显示为百分数(readonly)</label>
              <input id="myPercentageSettings-input" style="width: 70%; height: 100%;" readonly/>
          </div>
          <div id="myAlignmentSettings">
              <label for="myAlignmentSettings-input">对齐方式(readonly)</label>
              <input id="myAlignmentSettings-input" style="width: 70%; height: 100%;" readonly/>
          </div>
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

    
        // 获取需要禁用的表单元素
        this._myCustomUnitInput = this._shadowRoot.getElementById('myCustomUnit-input')
        this._myCustomScaleInput = this._shadowRoot.getElementById('myCustomScale-input')
        this._myCustomDecimalPlacesDropdown = this._shadowRoot.getElementById('myCustomDecimalPlaces-dropdown')
        this._myCustomThousandSeparatorDropdown = this._shadowRoot.getElementById('myCustomThousandSeparator-dropdown')

        this._myCustomThousandSeparatorDropdown.addEventListener('change', () => {
          if (this._myCustomThousandSeparatorDropdown.value === '100' || this._myCustomThousandSeparatorDropdown.value === 100) {
            this.clearAndDisableFields();
          } else {
            this.enableFields();
          }
        });

        // 初始化时候判断是否需要禁用表单元素
        if (this._myCustomThousandSeparatorDropdown.value === '100' || this._myCustomThousandSeparatorDropdown.value === 100) {
          this.clearAndDisableFields();
        } else {
          this.enableFields();
        };
  
        this._button = this._shadowRoot.getElementById('button')
        this._button.addEventListener('click', () => {
          const myContextMenu = this._shadowRoot.getElementById('myContextMenu-dropdown').value;
          const myRowHeader = this._shadowRoot.getElementById('myRowHeader-dropdown').value;
          const myColHeader = this._shadowRoot.getElementById('myColHeader-dropdown').value;
          const myIndentSettings = this._shadowRoot.getElementById('myIndentSettings-input').value;
          const myInsertData = this._shadowRoot.getElementById('myInsertData-input').value;
          const myMergeData = this._shadowRoot.getElementById('myMergeData-input').value;
          const myPercentageSettings = this._shadowRoot.getElementById('myPercentageSettings-input').value;
          const myAlignmentSettings = this._shadowRoot.getElementById('myAlignmentSettings-input').value;
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
              myPercentageSettings,
              myAlignmentSettings,
              myCustomUnit,
              myCustomScale,
              myCustomDecimalPlaces,
              myCustomThousandSeparator,
              myRowHeader,
              myColHeader
            } } }));
        })
      }

      // 当选中原始格式的时候禁用其他三个数据格式设置
      clearAndDisableFields() { 
        this._myCustomUnitInput.value = '';
        this._myCustomScaleInput.value = '';
        this._myCustomDecimalPlacesDropdown.value = 0;
        this._myCustomThousandSeparatorDropdown.value = 100;
    
        this._myCustomUnitInput.disabled = true;
        this._myCustomScaleInput.disabled = true;
        this._myCustomDecimalPlacesDropdown.disabled = true;
      }
    
      enableFields() {
        this._myCustomUnitInput.disabled = false;
        this._myCustomScaleInput.disabled = false;
        this._myCustomDecimalPlacesDropdown.disabled = false;
      }
    
  
      async onCustomWidgetAfterUpdate (changedProps) {
        if (changedProps.myIndentSettings) {
          const myIndentSettings = changedProps.myIndentSettings;
          this._shadowRoot.getElementById('myIndentSettings-input').value = changedProps.myIndentSettings;
        };

        if (changedProps.myInsertData) {
          const myInsertData = changedProps.myInsertData;
          this._shadowRoot.getElementById('myInsertData-input').value = changedProps.myInsertData;
        };

        if (changedProps.myMergeData) {
          const myMergeData = changedProps.myMergeData;
          this._shadowRoot.getElementById('myMergeData-input').value = changedProps.myMergeData;
        };

        if (changedProps.myPercentageSettings) {
          const myPercentageSettings = changedProps.myPercentageSettings;
          this._shadowRoot.getElementById('myPercentageSettings-input').value = changedProps.myPercentageSettings;
        };

        if (changedProps.myAlignmentSettings) {
          const myAlignmentSettings = changedProps.myAlignmentSettings;
          this._shadowRoot.getElementById('myAlignmentSettings-input').value = changedProps.myAlignmentSettings;
        };

        if (changedProps.myCustomUnit) {
          const myCustomUnit = changedProps.myCustomUnit;
          this._shadowRoot.getElementById('myCustomUnit-input').value = changedProps.myCustomUnit;
        };

        if (changedProps.myCustomScale) {
          const myCustomScale = changedProps.myCustomScale;
          this._shadowRoot.getElementById('myCustomScale-input').value = changedProps.myCustomScale;
        };

        if (changedProps.myCustomDecimalPlaces !== undefined && changedProps.myCustomDecimalPlaces !== null && changedProps.myCustomDecimalPlaces !== '') {
          let myCustomDecimalPlaces = changedProps.myCustomDecimalPlaces;
          this._shadowRoot.getElementById('myCustomDecimalPlaces-dropdown').value = myCustomDecimalPlaces;
        } else {
          let myCustomDecimalPlaces = 2;
          this._shadowRoot.getElementById('myCustomDecimalPlaces-dropdown').value = myCustomDecimalPlaces;
        };

        if (changedProps.myCustomThousandSeparator !== undefined && changedProps.myCustomThousandSeparator !== null && changedProps.myCustomThousandSeparator !== '') {
          if (changedProps.myCustomThousandSeparator === 100 || changedProps.myCustomThousandSeparator === '100') {
            this.clearAndDisableFields();
          } else {
            this.enableFields();
            let myCustomThousandSeparator = changedProps.myCustomThousandSeparator;
            this._shadowRoot.getElementById('myCustomThousandSeparator-dropdown').value = myCustomThousandSeparator;
          }
        } else {
          let myCustomThousandSeparator = 1;
          this._shadowRoot.getElementById('myCustomThousandSeparator-dropdown').value = myCustomThousandSeparator;
          this.enableFields();
        };

        if (changedProps.myRowHeader !== undefined && changedProps.myRowHeader !== null && changedProps.myRowHeader !== '') {
          let myRowHeader = changedProps.myRowHeader;
          this._shadowRoot.getElementById('myRowHeader-dropdown').value = myRowHeader;
        } else {
          let myRowHeader = true;
          this._shadowRoot.getElementById('myRowHeader-dropdown').value = myRowHeader;
        };

        if (changedProps.myColHeader !== undefined && changedProps.myColHeader !== null && changedProps.myColHeader !== '') {
          let myColHeader = changedProps.myColHeader;
          this._shadowRoot.getElementById('myColHeader-dropdown').value = myColHeader;
        } else {
          let myColHeader = true;
          this._shadowRoot.getElementById('myColHeader-dropdown').value = myColHeader;
        };

      }
    }
  
    customElements.define('com-sap-sac-exercise-table-styling-local', Styling)
  })()
