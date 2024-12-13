// 处理所有网络请求
async function handleFetch(url, params = null) {
    try {
        const options = {
            method: params ? 'POST' : 'GET',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };
        
        if (params) {
            options.body = params;
        }
        
        const response = await fetch(url, options);
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
            .then(response => sendResponse(response));
        return true; // 保持消息通道打开
    }
});

// 监听插件安装事件
chrome.runtime.onInstalled.addListener(() => {
    console.log('翻译插件已安装');
}); 