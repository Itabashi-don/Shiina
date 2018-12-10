# Note - 生成文章の評価基準

```Json
{
	"createdAt": [2018, 8, 27],
	"updatedAt": [2018, 12, 10]
}
```


## 評価の手順
1.	samplesディレクトリを以下の配置にする。
	```Directory
	- samples
	  - both
	    + 20180720kaiken.db
	    + 20180806hiroshima.db
	    + 20180809nagasaki.db
	    + 20180815sikiji.db
      - vocabulary
      - structure
	```
2.	[GeneratingFromSampleTest](/src/tests/GeneratingFromSampleTest.js)を用いて、文章を100件生成する。
3.	生成した文章を、以下の[評価基準](#評価基準)に則って評価する。
4.	分野別に評価を集計し、各評価の割合を出力する。


## 評価基準
> [機械翻訳 - Wikipedia](https://ja.wikipedia.org/wiki/%E6%A9%9F%E6%A2%B0%E7%BF%BB%E8%A8%B3#%E4%BA%BA%E6%89%8B%E8%A9%95%E4%BE%A1)を**参考にして**作成した。

以下のシートに則って、分野別に評価を行う。<Br />


### 語彙

| 評価 | 基準 |
|:-----:|:------|
| 3 | 語彙に違和感を覚えない。 |
| 2 | 語彙の種類は正しいが、語彙に多少の違和感を覚える。 |
| 1 | 語彙が正しいものでなく、文章として成立しない。 |

### 文法構造

| 評価 | 基準 |
|:-----:|:------|
| 3 | 文法構造に違和感を覚えない。 |
| 2 | 文法構造に多少の違和感を覚えるが、文章の流れが理解できる。 |
| 1 | 文法構造に違和感を覚える。 |
