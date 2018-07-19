# vue-i18n 替换工具（中文）
##  通过该工具，可以将未加入vue-i18n的vue项目自动提取项目vue文件中的中文部分生成国际化配置文件并自动替换对应位置
### 安装
```
sudo npm install -g vue-i18n-cli
sudo yarn global add vue-i18n-cli
```
### 运行

项目根目录执行 i18n
```
i18n generate ./src
```
然后就会在根目录生成一个 zh-cn.js 的配置文件，之后对项目引入vue-i18n并采用该配置文件即可

```javascript
import VueI18n from 'vue-i18n';

Vue.use(VueI18n);
const i18n = new VueI18n({
	locale: 'zh-cn',
	messages: {
		'zh-cn': require('../zh-cn')
	}
});
new Vue({
	router,
	//...
	i18n,
	//...
	render: h => h(App)
}).$mount('#app');
```
### 注意

-   本工具只替换vue文件的中文部分，包括template和script中的中文内容
-   vue文件中的props中的各个属性的default中不要使用中文，否则替换后无法正常使用
-   对于需要做字符串连接的部分，不要使用 + 号，使用 \`\`符号进行连接，这样在生成的时候会自动将 ${} 部分作为参数传入

### 参考
[vue-i18n 文档](https://kazupon.github.io/vue-i18n/)