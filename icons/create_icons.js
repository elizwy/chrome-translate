// 创建一个canvas元素来生成图标
function createIcon(size) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // 设置背景
    ctx.fillStyle = '#4285f4';
    ctx.beginPath();
    ctx.arc(size/2, size/2, size/2, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制"T"字母
    ctx.fillStyle = 'white';
    ctx.font = `bold ${size * 0.6}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('T', size/2, size/2);
    
    // 转换为PNG格式
    return canvas.toDataURL('image/png');
}

// 生成三种尺寸的图标
const sizes = [16, 48, 128];
sizes.forEach(size => {
    const link = document.createElement('a');
    link.download = `icon${size}.png`;
    link.href = createIcon(size);
    link.click();
}); 