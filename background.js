// 处理所有网络请求
async function handleFetch(url, params = null) {
    try {
        const options = {
            method: params ? 'POST' : 'GET',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            credentials: 'omit'  // 不发送cookie
        };
        
        if (params) {
            options.body = params;
        }
        
        const response = await fetch(url, options);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return { success: true, data };
    } catch (error) {
        console.error('请求失败:', error);
        return { success: false, error: error.message };
    }
}

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'translate' || request.action === 'fetchDefinition') {
        handleFetch(request.url, request.params)
            .then(response => {
                try {
                    sendResponse(response);
                } catch (error) {
                    console.error('发送响应失败:', error);
                    sendResponse({ success: false, error: '发送响应失败' });
                }
            })
            .catch(error => {
                console.error('处理请求失败:', error);
                sendResponse({ success: false, error: '处理请求失败' });
            });
        return true; // 保持消息通道打开
    }
});

// 监听插件安装事件
chrome.runtime.onInstalled.addListener(() => {
    // 初始化存储
    chrome.storage.local.get(['savedWords', 'displayOrder', 'translationEngine'], result => {
        const updates = {};
        if (!result.savedWords) updates.savedWords = {};
        if (!result.displayOrder) updates.displayOrder = 'zh-first';
        if (!result.translationEngine) updates.translationEngine = 'google';
        
        if (Object.keys(updates).length > 0) {
            chrome.storage.local.set(updates);
        }
    });
}); 