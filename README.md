# vue-i18n 替换工具（中文）
##  通过该工具，可以将未加入vue-i18n的vue项目自动提取项目vue/js（js文件会自动查找是否已经引用过VUE，若没有引用会自动引用并创键实例，绑定$t方法）文件中的中文部分生成国际化配置文件并自动替换对应位置
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

执行时，可以通过参数控制key和index，如下
```
-k, --key <key>            自定义key前缀，默认为相对执行目录的文件路径
-s, --single               是否为单文件index序列，默认为全局序列，当自定义key之后，此设置无效
-p, --path <path>          设置生成文件的路径，默认为运行目录（请设置已经存在的目录！！！）
-f, --filename <filename>  设置生成文件名，默认为zh_cn
```
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

-   vue文件中的props中的各个属性的default中不要使用中文，否则替换后无法正常使用
-   vue文件中的filters中不要使用中文，否则替换后无法正常使用
-   对未自定义key的情况，会在单个文件中对value部分去重，自定义key之后，会在全局对value部分去重
-   对于需要做字符串连接的部分，不要使用 + 号，使用 \`\`符号进行连接，这样在生成的时候会自动将 ${} 部分作为参数传入
-   若替换后有报错，且错误信息在JS文件替换后出现，那么请调整一下import的顺序，确保JS文件的引入前，已经完成了i18n的相关设置(建议将i18n的配置单独一个文件，这样可以方便调整引用位置)

### 参考
[vue-i18n 文档](https://kazupon.github.io/vue-i18n/)