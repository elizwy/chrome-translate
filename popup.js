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

    // 修改显示保存的单词列表部分
    const wordList = document.getElementById('wordList');
    
    async function refreshWordList() {
        try {
            // 获取保存的单词
            const result = await chrome.storage.local.get('savedWords');
            console.log('获取到的完整数据:', result); // 调试日志
            
            const savedWords = result.savedWords || {};
            console.log('解析后的savedWords:', savedWords); // 调试日志
            
            // 检查是否有保存的单词
            if (Object.keys(savedWords).length === 0) {
                wordList.innerHTML = '<div class="no-words">还没有保存任何单词</div>';
                return;
            }

            // 清空现有内容
            wordList.innerHTML = '';

            // 按日期降序排序
            const sortedDates = Object.keys(savedWords).sort((a, b) => new Date(b) - new Date(a));
            console.log('排序后的日期:', sortedDates); // 调试日志

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

                // 遍历该日期下的所有页面
                const pages = savedWords[date];
                if (pages && typeof pages === 'object') {
                    Object.entries(pages).forEach(([pageUrl, pageData]) => {
                        if (!pageData || !pageData.words) return;

                        const pageSection = document.createElement('div');
                        pageSection.className = 'page-section';
                        
                        // 创建页面标题和链接
                        const pageHeader = document.createElement('div');
                        pageHeader.className = 'page-header';
                        
                        const pageLink = document.createElement('a');
                        pageLink.href = pageUrl;
                        pageLink.textContent = pageData.title || pageUrl;
                        pageLink.target = '_blank';
                        pageLink.className = 'page-link';
                        
                        const pageDeleteBtn = document.createElement('button');
                        pageDeleteBtn.className = 'page-delete-btn';
                        pageDeleteBtn.textContent = '删除';
                        pageDeleteBtn.onclick = async (e) => {
                            e.preventDefault();
                            if (confirm(`确定要删除来自 "${pageData.title}" 的所有单词吗？`)) {
                                delete savedWords[date][pageUrl];
                                if (Object.keys(savedWords[date]).length === 0) {
                                    delete savedWords[date];
                                }
                                await chrome.storage.local.set({ savedWords });
                                pageSection.remove();
                                
                                if (Object.keys(savedWords).length === 0) {
                                    wordList.innerHTML = '<div class="no-words">还没有保存任何单词</div>';
                                }
                            }
                        };
                        
                        pageHeader.appendChild(pageLink);
                        pageHeader.appendChild(pageDeleteBtn);
                        pageSection.appendChild(pageHeader);

                        // 显示该页面的单词列表
                        pageData.words.forEach(item => {
                            if (!item || !item.word) return;

                            const wordItem = document.createElement('div');
                            wordItem.className = 'word-item';

                            const word = document.createElement('div');
                            word.className = 'word';
                            word.textContent = item.word;

                            const translation = document.createElement('div');
                            translation.className = 'translation';
                            translation.textContent = `中文释义：${item.translation || '无'}`;

                            const definition = document.createElement('div');
                            definition.className = 'definition';
                            definition.textContent = `英文释义：${item.definition || '无'}`;

                            wordItem.appendChild(word);
                            wordItem.appendChild(translation);
                            wordItem.appendChild(definition);
                            pageSection.appendChild(wordItem);
                        });

                        dateSection.appendChild(pageSection);
                    });
                }

                wordList.appendChild(dateSection);
            });
        } catch (error) {
            console.error('加载单词列表失败:', error);
            wordList.innerHTML = '<div class="no-words" style="color: #ff4444;">加载单词列表失败，请重试</div>';
        }
    }

    // 初始加载单词列表
    await refreshWordList();

    // 修改清空所有单词的功能
    const clearAllBtn = document.getElementById('clearAllBtn');
    
    clearAllBtn.addEventListener('click', async () => {
        try {
            // 获取当前保存的单词
            const { savedWords = {} } = await chrome.storage.local.get('savedWords');
            
            // 检查是否有单词可以清空
            if (Object.keys(savedWords).length === 0) {
                alert('没有已保存的单词');
                return;
            }

            // 弹出确认对话框
            if (window.confirm('确定要清空所有保存的单词吗？此操作不可恢复！')) {
                // 清空保存的单词
                await chrome.storage.local.set({ savedWords: {} });
                
                // 刷新显示
                await refreshWordList();
                
                // 显示成功提示
                alert('已成功清空所有单词');
            }
        } catch (error) {
            console.error('清空单词失败:', error);
            alert('清空单词失败，请重试');
        }
    });

    // 修改源码跳转功能
    const donateBtn = document.getElementById('donateBtn');
    
    // 点击按钮跳转到源码仓库
    donateBtn.addEventListener('click', () => {
        // 使用chrome.tabs.create打开新标签页
        chrome.tabs.create({
            url: 'https://github.com/elizwy/chrome-translate',
            active: true  // 立即切换到新标签页
        }).catch(error => {
            console.error('打开链接失败:', error);
            // 使用备用方法
            window.open('https://github.com/elizwy/chrome-translate', '_blank');
        });
    });
}); 