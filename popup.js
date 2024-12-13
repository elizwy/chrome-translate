document.addEventListener('DOMContentLoaded', async () => {
    // 加载所有配置
    const {
        displayOrder = 'zh-first',
        translationEngine = 'google',
        baiduConfig = {},
        youdaoConfig = {}
    } = await chrome.storage.local.get(['displayOrder', 'translationEngine', 'baiduConfig', 'youdaoConfig']);

    // 设置显示顺序
    document.querySelector(`input[value="${displayOrder}"]`).checked = true;
    
    // 设置翻译引擎
    const engineSelect = document.getElementById('translationEngine');
    engineSelect.value = translationEngine;
    
    // 设置API配置的显示/隐藏
    const baiduConfig_div = document.getElementById('baiduConfig');
    const youdaoConfig_div = document.getElementById('youdaoConfig');
    
    // 根据选择的引擎显示对应的配置
    function updateEngineConfig() {
        baiduConfig_div.style.display = engineSelect.value === 'baidu' ? 'block' : 'none';
        youdaoConfig_div.style.display = engineSelect.value === 'youdao' ? 'block' : 'none';
    }
    
    // 初始化配置显示
    updateEngineConfig();
    
    // 填充已保存的配置
    if (baiduConfig) {
        document.getElementById('baiduAppId').value = baiduConfig.appId || '';
        document.getElementById('baiduKey').value = baiduConfig.key || '';
    }
    if (youdaoConfig) {
        document.getElementById('youdaoAppKey').value = youdaoConfig.appKey || '';
        document.getElementById('youdaoSecret').value = youdaoConfig.secret || '';
    }
    
    // 监听引擎选择变化
    engineSelect.addEventListener('change', updateEngineConfig);

    // 保存配置
    document.getElementById('saveConfig').addEventListener('click', async () => {
        const selectedOrder = document.querySelector('input[name="displayOrder"]:checked').value;
        const selectedEngine = engineSelect.value;
        
        const config = {
            displayOrder: selectedOrder,
            translationEngine: selectedEngine
        };
        
        // 保存API配置
        if (selectedEngine === 'baidu') {
            config.baiduConfig = {
                appId: document.getElementById('baiduAppId').value,
                key: document.getElementById('baiduKey').value
            };
        } else if (selectedEngine === 'youdao') {
            config.youdaoConfig = {
                appKey: document.getElementById('youdaoAppKey').value,
                secret: document.getElementById('youdaoSecret').value
            };
        }
        
        await chrome.storage.local.set(config);
        
        // 显示保存成功提示
        const button = document.getElementById('saveConfig');
        const originalText = button.textContent;
        button.textContent = '已保存';
        button.style.background = '#34a853';
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '#4285f4';
        }, 1000);
    });

    // 显示保存的单词列表
    const wordList = document.getElementById('wordList');
    const { savedWords = {} } = await chrome.storage.local.get('savedWords');
    
    if (Object.keys(savedWords).length === 0) {
        wordList.innerHTML = '<div class="no-words">还没有保存任何单词</div>';
        return;
    }

    // 按日期降序排序
    const sortedDates = Object.keys(savedWords).sort((a, b) => new Date(b) - new Date(a));

    sortedDates.forEach(date => {
        const dateSection = document.createElement('div');
        dateSection.className = 'date-section';

        const dateHeader = document.createElement('div');
        dateHeader.className = 'date-header';

        const dateTitle = document.createElement('div');
        dateTitle.className = 'date-title';
        dateTitle.textContent = date;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '删除';
        deleteBtn.onclick = async () => {
            if (confirm(`确定要删除 ${date} 的所有单词吗？`)) {
                delete savedWords[date];
                await chrome.storage.local.set({ savedWords });
                dateSection.remove();
                
                if (Object.keys(savedWords).length === 0) {
                    wordList.innerHTML = '<div class="no-words">还没有保存任何单词</div>';
                }
            }
        };

        dateHeader.appendChild(dateTitle);
        dateHeader.appendChild(deleteBtn);
        dateSection.appendChild(dateHeader);

        savedWords[date].forEach(item => {
            const wordItem = document.createElement('div');
            wordItem.className = 'word-item';

            const word = document.createElement('div');
            word.className = 'word';
            word.textContent = item.word;

            const translation = document.createElement('div');
            translation.className = 'translation';
            translation.textContent = `中文释义：${item.translation}`;

            const definition = document.createElement('div');
            definition.className = 'definition';
            definition.textContent = `英文释义：${item.definition}`;

            wordItem.appendChild(word);
            wordItem.appendChild(translation);
            wordItem.appendChild(definition);
            dateSection.appendChild(wordItem);
        });

        wordList.appendChild(dateSection);
    });

    // 修改为源码跳转功能
    const donateBtn = document.getElementById('donateBtn');
    
    // 点击按钮跳转到源码仓库
    donateBtn.addEventListener('click', () => {
        chrome.tabs.create({
            url: 'https://github.com/yourusername/chrome-translator'
        });
    });
}); 