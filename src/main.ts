interface ImageProcessorConfig {
  maskOpacity: number;
  maskColor: string;
  imageOpacity: number;
  blurAmount: number;
}

class ImageProcessor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private originalImage: HTMLImageElement | null = null;
  private config: ImageProcessorConfig = {
    maskOpacity: 0,
    maskColor: '#000000',
    imageOpacity: 100,
    blurAmount: 0
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('无法获取 Canvas 2D 上下文');
    }
    this.ctx = context;
  }

  loadImage(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();

        img.onload = () => {
          this.originalImage = img;
          this.canvas.width = img.width;
          this.canvas.height = img.height;
          this.render();
          resolve();
        };

        img.onerror = () => {
          reject(new Error('图片加载失败'));
        };

        img.src = e.target?.result as string;
      };

      reader.onerror = () => {
        reject(new Error('文件读取失败'));
      };

      reader.readAsDataURL(file);
    });
  }

  updateConfig(newConfig: Partial<ImageProcessorConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.render();
  }

  reset(): void {
    this.config = {
      maskOpacity: 0,
      maskColor: '#000000',
      imageOpacity: 100,
      blurAmount: 0
    };
    this.render();
  }

  private render(): void {
    if (!this.originalImage) return;

    // 清空画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 保存当前状态
    this.ctx.save();

    // 设置图片透明度
    this.ctx.globalAlpha = this.config.imageOpacity / 100;

    // 设置模糊效果
    if (this.config.blurAmount > 0) {
      this.ctx.filter = `blur(${this.config.blurAmount}px)`;
    } else {
      this.ctx.filter = 'none';
    }

    // 绘制原始图片
    this.ctx.drawImage(this.originalImage, 0, 0);

    // 恢复滤镜设置
    this.ctx.filter = 'none';

    // 绘制蒙版
    if (this.config.maskOpacity > 0) {
      this.ctx.globalAlpha = this.config.maskOpacity / 100;
      this.ctx.fillStyle = this.config.maskColor;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // 恢复状态
    this.ctx.restore();
  }

  download(filename: string = 'processed-image.png'): void {
    const link = document.createElement('a');
    link.download = filename;
    link.href = this.canvas.toDataURL('image/png');
    link.click();
  }

  getConfig(): ImageProcessorConfig {
    return { ...this.config };
  }
}

// 初始化应用
function initApp(): void {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  const imageInput = document.getElementById('imageInput') as HTMLInputElement;
  const uploadBtn = document.getElementById('uploadBtn') as HTMLButtonElement;
  const editorSection = document.getElementById('editorSection') as HTMLDivElement;

  const maskOpacitySlider = document.getElementById('maskOpacity') as HTMLInputElement;
  const maskOpacityValue = document.getElementById('maskOpacityValue') as HTMLSpanElement;
  const maskColorInput = document.getElementById('maskColor') as HTMLInputElement;

  const imageOpacitySlider = document.getElementById('imageOpacity') as HTMLInputElement;
  const imageOpacityValue = document.getElementById('imageOpacityValue') as HTMLSpanElement;

  const blurAmountSlider = document.getElementById('blurAmount') as HTMLInputElement;
  const blurAmountValue = document.getElementById('blurAmountValue') as HTMLSpanElement;

  const resetBtn = document.getElementById('resetBtn') as HTMLButtonElement;
  const downloadBtn = document.getElementById('downloadBtn') as HTMLButtonElement;

  const processor = new ImageProcessor(canvas);

  // 点击上传按钮
  uploadBtn.addEventListener('click', () => {
    imageInput.click();
  });

  // 选择图片
  imageInput.addEventListener('change', async (e) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];

    if (file) {
      try {
        await processor.loadImage(file);
        editorSection.style.display = 'flex';
      } catch (error) {
        alert('图片加载失败,请重试');
        console.error(error);
      }
    }
  });

  // 蒙版透明度
  maskOpacitySlider.addEventListener('input', (e) => {
    const value = parseInt((e.target as HTMLInputElement).value);
    maskOpacityValue.textContent = `${value}%`;
    processor.updateConfig({ maskOpacity: value });
  });

  // 蒙版颜色
  maskColorInput.addEventListener('input', (e) => {
    const value = (e.target as HTMLInputElement).value;
    processor.updateConfig({ maskColor: value });
  });

  // 图片透明度
  imageOpacitySlider.addEventListener('input', (e) => {
    const value = parseInt((e.target as HTMLInputElement).value);
    imageOpacityValue.textContent = `${value}%`;
    processor.updateConfig({ imageOpacity: value });
  });

  // 模糊程度
  blurAmountSlider.addEventListener('input', (e) => {
    const value = parseFloat((e.target as HTMLInputElement).value);
    blurAmountValue.textContent = `${value}px`;
    processor.updateConfig({ blurAmount: value });
  });

  // 重置
  resetBtn.addEventListener('click', () => {
    processor.reset();

    // 重置 UI
    maskOpacitySlider.value = '0';
    maskOpacityValue.textContent = '0%';
    maskColorInput.value = '#000000';

    imageOpacitySlider.value = '100';
    imageOpacityValue.textContent = '100%';

    blurAmountSlider.value = '0';
    blurAmountValue.textContent = '0px';
  });

  // 下载
  downloadBtn.addEventListener('click', () => {
    const timestamp = new Date().getTime();
    processor.download(`quick-pic-${timestamp}.png`);
  });
}

// DOM 加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

export { ImageProcessor };
