// 创建翻译按钮
const translateButton = document.createElement('button');
translateButton.textContent = '翻译';
translateButton.style.cssText = `
    position: fixed;
    display: none;
    z-index: 999999;
    padding: 5px 10px;
    background: #4285f4;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
`;

document.body.appendChild(translateButton);

let currentPopup = null;
let loadingPopup = null;
let translateTimeout = null;

// 监听选中文本事件
document.addEventListener('mouseup', function(e) {
    setTimeout(() => {
        const selectedText = window.getSelection().toString().trim();
        
        if (selectedText !== '') {
            const selection = window.getSelection();
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            
            // 修改按钮位置计算，考虑滚动和视口位置
            const viewportHeight = window.innerHeight;
            const buttonX = Math.min(rect.left + window.scrollX, window.innerWidth - 60); // 防止按钮超出右边界
            let buttonY = rect.bottom + window.scrollY;

            // 确保按钮在视口内
            if (buttonY - window.scrollY > viewportHeight - 40) {
                buttonY = rect.top + window.scrollY - 30; // 如果底部空间不够，显示在选中文本上方
            }
            
            translateButton.style.display = 'block';
            translateButton.style.left = `${buttonX}px`;
            translateButton.style.top = `${buttonY}px`;
        } else {
            if (e.target !== translateButton) {
                translateButton.style.display = 'none';
            }
        }
    }, 10);
});

// 创建加载提示
function showLoadingPopup() {
    loadingPopup = document.createElement('div');
    loadingPopup.style.cssText = `
        position: fixed;
        left: ${translateButton.style.left};
        top: ${translateButton.style.top};
        transform: translateY(-100%);
        background: white;
        padding: 10px;
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 1000000;
    `;
    loadingPopup.textContent = '翻译中...';
    document.body.appendChild(loadingPopup);
}

// 检查单词是否已保存
async function checkWordSaved(word) {
    const { savedWords = {} } = await chrome.storage.local.get('savedWords');
    const today = new Date().toISOString().split('T')[0];
    
    // 检查所有日期中是否存在该单词
    return Object.values(savedWords).some(dayWords => 
        dayWords.some(item => item.word === word)
    );
}

// 显示翻译结果
async function showTranslation(chineseTranslation, englishDefinition) {
    if (loadingPopup) {
        loadingPopup.remove();
        loadingPopup = null;
    }
    
    const selectedText = window.getSelection().toString().trim();
    const isWordSaved = await checkWordSaved(selectedText);
    
    // 获取显示顺序配置
    const { displayOrder = 'zh-first' } = await chrome.storage.local.get('displayOrder');
    
    const popup = document.createElement('div');
    popup.classList.add('translation-popup');
    
    // 计算弹窗位置
    const buttonRect = translateButton.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    // 初始样式设置
    popup.style.cssText = `
        position: fixed;
        background: white;
        padding: 15px;
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 1000000;
        max-width: 350px;
        word-wrap: break-word;
        font-size: 14px;
    `;
    
    // 先添加到文档以获��实际尺寸
    document.body.appendChild(popup);
    const popupRect = popup.getBoundingClientRect();
    
    // 计算最终位置
    let left = buttonRect.left;
    let top = buttonRect.top - popupRect.height - 5;
    
    // 如果弹窗会超出右边界，向左偏移
    if (left + popupRect.width > viewportWidth) {
        left = viewportWidth - popupRect.width - 10;
    }
    
    // 如果弹窗会超出上边界，显示在按钮下方
    if (top < 0) {
        top = buttonRect.bottom + 5;
    }
    
    // 应用计算后的位置
    popup.style.left = `${left}px`;
    popup.style.top = `${top}px`;

    // 创建中文翻译部分
    const chineseSection = document.createElement('div');
    chineseSection.style.cssText = `
        margin-bottom: 10px;
        padding-bottom: 10px;
        border-bottom: 1px solid #eee;
    `;
    const chineseLabel = document.createElement('div');
    chineseLabel.textContent = '中文释义：';
    chineseLabel.style.color = '#666';
    chineseLabel.style.fontSize = '12px';
    chineseLabel.style.marginBottom = '5px';
    const chineseText = document.createElement('div');
    chineseText.textContent = chineseTranslation;
    chineseSection.appendChild(chineseLabel);
    chineseSection.appendChild(chineseText);

    // 创建英文释义部分
    const englishSection = document.createElement('div');
    
    // 添加词性
    if (englishDefinition.partOfSpeech) {
        const posLabel = document.createElement('div');
        posLabel.style.cssText = `
            color: #4285f4;
            font-size: 12px;
            font-style: italic;
            margin-bottom: 8px;
        `;
        posLabel.textContent = englishDefinition.partOfSpeech;
        englishSection.appendChild(posLabel);
    }

    const englishLabel = document.createElement('div');
    englishLabel.textContent = '英文释义：';
    englishLabel.style.color = '#666';
    englishLabel.style.fontSize = '12px';
    englishLabel.style.marginBottom = '5px';
    
    // 添加英文释义内容
    const englishText = document.createElement('div');
    englishText.textContent = englishDefinition.definition;
    englishText.style.marginBottom = '10px';
    
    // 添加例句
    if (englishDefinition.example) {
        const exampleSection = document.createElement('div');
        exampleSection.style.cssText = `
            margin-top: 8px;
            padding: 8px;
            background: #f5f5f5;
            border-radius: 4px;
            font-style: italic;
            color: #666;
            font-size: 13px;
        `;
        exampleSection.textContent = `Example: "${englishDefinition.example}"`;
        englishText.appendChild(exampleSection);
    }
    
    // 添加词典来源信息
    const sourceInfo = document.createElement('div');
    sourceInfo.style.cssText = `
        color: #999;
        font-size: 11px;
        font-style: italic;
        text-align: right;
        margin-top: 8px;
    `;
    sourceInfo.textContent = `来源: ${englishDefinition.source}`;
    
    englishSection.appendChild(englishLabel);
    englishSection.appendChild(englishText);
    englishSection.appendChild(sourceInfo);

    // 根据配置决定显示顺序
    if (displayOrder === 'zh-first') {
        popup.appendChild(chineseSection);
        popup.appendChild(englishSection);
    } else {
        popup.appendChild(englishSection);
        popup.appendChild(chineseSection);
    }
    
    // 添加保存按钮
    const saveButton = document.createElement('button');
    saveButton.style.cssText = `
        background: ${isWordSaved ? '#666' : '#4285f4'};
        color: white;
        border: none;
        padding: 5px 10px;
        border-radius: 4px;
        cursor: ${isWordSaved ? 'default' : 'pointer'};
        margin-top: 10px;
        font-size: 12px;
    `;
    saveButton.textContent = isWordSaved ? '已保存' : '保存单词';
    saveButton.disabled = isWordSaved;
    
    // 点击保存按钮时保存单词
    if (!isWordSaved) {
        saveButton.onclick = async () => {
            const today = new Date().toISOString().split('T')[0];
            
            try {
                const { savedWords = {} } = await chrome.storage.local.get('savedWords');
                
                if (!savedWords[today]) {
                    savedWords[today] = [];
                }
                
                const isDuplicate = savedWords[today].some(item => item.word === selectedText);
                
                if (!isDuplicate) {
                    savedWords[today].push({
                        word: selectedText,
                        translation: chineseTranslation,
                        definition: englishDefinition.definition,
                        timestamp: new Date().getTime()
                    });
                    
                    await chrome.storage.local.set({ savedWords });
                    
                    saveButton.textContent = '已保存';
                    saveButton.style.background = '#34a853';
                    saveButton.disabled = true;
                    saveButton.style.cursor = 'default';

                    // 保存成功后延迟1秒关闭
                    setTimeout(() => {
                        if (currentPopup) {
                            currentPopup.remove();
                            currentPopup = null;
                        }
                        translateButton.style.display = 'none';
                    }, 1000);
                }
            } catch (error) {
                console.error('保存失败:', error);
                saveButton.textContent = '保存失败';
                saveButton.style.background = '#ff4444';
            }
        };
    }
    
    popup.appendChild(saveButton);
    
    if (currentPopup) {
        currentPopup.remove();
    }
    
    document.body.appendChild(popup);
    currentPopup = popup;

    // 修改popup的事件处理
    popup.addEventListener('mouseenter', () => {
        // 鼠标移入popup时，清除关闭定时器
        if (translateTimeout) {
            clearTimeout(translateTimeout);
            translateTimeout = null;
        }
    });

    popup.addEventListener('mouseleave', () => {
        // 鼠标移出popup时，设置延时关闭
        translateTimeout = setTimeout(() => {
            if (currentPopup) {
                currentPopup.remove();
                currentPopup = null;
            }
            translateButton.style.display = 'none';
        }, 500); // 延迟500ms关闭
    });
}

// 修改获取英文释义函数，通过background script发送请求
async function getEnglishDefinition(text) {
    try {
        const response = await chrome.runtime.sendMessage({
            action: 'fetchDefinition',
            url: `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(text)}`
        });
        
        if (response.success && response.data) {
            const data = response.data;
            if (data && data[0] && data[0].meanings && data[0].meanings[0]) {
                const meaning = data[0].meanings[0];
                const definition = meaning.definitions[0];
                
                return {
                    definition: definition.definition,
                    partOfSpeech: meaning.partOfSpeech,
                    example: definition.example || null,
                    source: data[0].sourceUrls && data[0].sourceUrls[0] 
                        ? new URL(data[0].sourceUrls[0]).hostname
                        : 'Free Dictionary API'
                };
            }
        }
        return {
            definition: '未找到英文释义',
            partOfSpeech: null,
            example: null,
            source: 'N/A'
        };
    } catch (error) {
        console.error('获取英文释义失败:', error);
        return {
            definition: '获取英文释义失败',
            partOfSpeech: null,
            example: null,
            source: 'Error'
        };
    }
}

// 修改翻译函数，通过background script发送请求
async function translateText(text) {
    const { 
        translationEngine = 'google',
        baiduConfig,
        youdaoConfig
    } = await chrome.storage.local.get(['translationEngine', 'baiduConfig', 'youdaoConfig']);

    try {
        let url;
        let params;
        
        switch (translationEngine) {
            case 'baidu':
                if (baiduConfig && baiduConfig.appId && baiduConfig.key) {
                    const salt = new Date().getTime();
                    const str = baiduConfig.appId + text + salt + baiduConfig.key;
                    const sign = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
                        .then(buffer => Array.from(new Uint8Array(buffer))
                            .map(b => b.toString(16).padStart(2, '0'))
                            .join(''));

                    url = `https://fanyi-api.baidu.com/api/trans/vip/translate?q=${encodeURIComponent(text)}&from=en&to=zh&appid=${baiduConfig.appId}&salt=${salt}&sign=${sign}`;
                    break;
                }
                console.warn('未配置百度翻译API，使用Google翻译');
                // 继续执行默认的Google翻译
                
            case 'youdao':
                if (youdaoConfig && youdaoConfig.appKey && youdaoConfig.secret) {
                    // ... 有道翻译的配置 ...
                    break;
                }
                console.warn('未配置有道翻译API，使用Google翻译');
                // 继续执行默认的Google翻译
                
            default:
                url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-CN&dt=t&q=${encodeURIComponent(text)}`;
        }

        const response = await chrome.runtime.sendMessage({
            action: 'translate',
            url: url,
            params: params
        });

        if (response.success) {
            if (translationEngine === 'baidu' && response.data.trans_result) {
                return response.data.trans_result[0].dst;
            } else if (translationEngine === 'youdao' && response.data.translation) {
                return response.data.translation[0];
            } else {
                // Google翻译
                return response.data[0][0][0];
            }
        }
        throw new Error('翻译失败');
    } catch (error) {
        console.error('翻译失败:', error);
        return '翻译失败';
    }
}

// 鼠标移入翻译按钮时发翻译
translateButton.addEventListener('mouseenter', () => {
    const selectedText = window.getSelection().toString().trim();
    if (selectedText) {
        // 清除之前的定时器
        if (translateTimeout) {
            clearTimeout(translateTimeout);
            translateTimeout = null;
        }
        showLoadingPopup();
        
        // 开始翻译
        translateTimeout = setTimeout(async () => {
            const [chineseTranslation, englishDefinition] = await Promise.all([
                translateText(selectedText),
                getEnglishDefinition(selectedText)
            ]);
            showTranslation(chineseTranslation, englishDefinition);
        }, 100);
    }
});

// 鼠标离开翻译按钮时关闭翻译结果
translateButton.addEventListener('mouseleave', () => {
    // 设置延时，让用户有时间移动到翻译框
    translateTimeout = setTimeout(() => {
        if (loadingPopup) {
            loadingPopup.remove();
            loadingPopup = null;
        }
        
        // 只有当鼠标不在翻译框内时才关闭
        if (currentPopup && !currentPopup.matches(':hover')) {
            currentPopup.remove();
            currentPopup = null;
            translateButton.style.display = 'none';
        }
    }, 200);
});

// 点击页面其他地方时隐藏翻译按钮和结果
document.addEventListener('mousedown', (e) => {
    // 如果点击的是翻译按钮、翻译框或保存按钮，不做处理
    if (e.target === translateButton || 
        (currentPopup && (currentPopup.contains(e.target) || e.target.closest('.translation-popup')))) {
        return;
    }
    
    // 点击其他地方才关闭
    translateButton.style.display = 'none';
    if (currentPopup) {
        currentPopup.remove();
        currentPopup = null;
    }
});

// 防止选中文本消失
translateButton.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
}); 