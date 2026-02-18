/**
 * PythonのGANwebmain.pyの主要ロジックをJSに移植した関数
 * @param {string} rawHtml - アップロードされたファイルのテキスト内容
 * @param {string} mode - 選択されたモード (例: '1', '2'など)
 * @returns {string} - 変換後のHTML文字列
 */
function processHTML(rawHtml, mode) {
    // --- 1. 定数・ヘルパー関数定義 ---
    
    let moveCT = 0; // 手数カウント

    const ROTATE_MAP = {
        "x": "x'", "x'": "x", "z": "z'", "z'": "z",
        "F": "F'", "F'": "F", "B": "B'", "B'": "B",
        "U": "U'", "U'": "U", "D": "D'", "D'": "D",
        "L": "L'", "L'": "L", "R": "R'", "R'": "R"
    };

    /** 回転手順を反転（順序も逆にする） */
    function reverseMoves(moves) {
        if (!moves) return [];
        const tokens = moves.trim().split(/\s+/);
        const reversedTokens = [];
        for (let i = tokens.length - 1; i >= 0; i--) {
            const token = tokens[i];
            reversedTokens.push(ROTATE_MAP[token] || token);
        }
        return reversedTokens;
    }

    /** DOM操作: create/restore手順にonclick属性をつける */
function processFace(flex, mod, adj) {
        // classに "row py-2" を含む回転文字列のdivを取得
        let cubeL = flex.querySelectorAll('div[class*="row py-2"]');
        let i = 0;

        cubeL.forEach(lis => {
            const x = String((i * 3) + (adj & 1) * 30);
            const y = "0"; 

            let lisdiv2 = lis.querySelector('div.col.col-auto.px-2');
            let lisdiv0 = lis.querySelector('div.col.col-auto.px-0');
            i++;

            const originalText = lisdiv2.textContent.replaceAll('  ','').trim();
            let rvsary=[];
            // 新しいdivを作成して置換する準備
            lisdiv2.setAttribute("onclick", `fwdRot(this,${x},${y})`);
            const newDiv = lisdiv2.cloneNode(true);

            if (mod == 1) { // 戻しの生成
                rvsary = reverseMoves(originalText);
                newDiv.textContent = rvsary.join(" ");
            }

            if (lisdiv0 && !lisdiv0.hasAttribute("onclick"))
                if (mod == 1) {
                        lisdiv0.setAttribute("onclick", `rvsRot(this,${x},${y})`);
                        moveCT += rvsary.length;
                } else  lisdiv0.setAttribute("onclick", `fwdRot(this,${x},${y})`);

            if (mod == 1) { // 戻しの位置交換 (DOM要素の入替)
                const lisdiv = lisdiv0.cloneNode(true); // deep copy
                
                // 既存の要素を取得して置換                
                lisdiv0.replaceWith(newDiv);
                lisdiv2.replaceWith(lisdiv);
            }
        });
        // DOMツリーへの挿入
        insertTarget.after(flex);
    }

    // --- 2. HTML解析 ---
    const parser = new DOMParser();
    const sourceDoc = parser.parseFromString(rawHtml, "text/html");

    // メタデータの抽出
    const imgTag = sourceDoc.querySelector("img.img-fluid");
    const img = imgTag ? imgTag.getAttribute("src") : "";
    
    const brandTag = sourceDoc.querySelector("a.navbar-brand");
    const boardSizeStr = brandTag ? brandTag.textContent.slice(0, -8) : "20x20"; // "20x20 in each" -> "20x20"
    
    const Row = parseInt(boardSizeStr.substring(0, 2)) || 20;
    const Col = parseInt(boardSizeStr.substring(9, 11)) || 20;
    
    let ADface = "A-C面";
    if (Row === 30) ADface = "A-F面";
    else if (Col === 20) ADface = "A-D面";

    // --- 3. 新しいHTML構造の構築 ---
    // Python版のhead_block + nihongo + body_blockを結合したテンプレート
    const outputHtml = document.implementation.createHTMLDocument("モザイク制作ナビゲーター");
    
    // HEADの設定
    outputHtml.head.innerHTML = `
    <meta charset="UTF-8">
    <link rel="icon" href="./favicon.ico">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Optimal algs for mosaic">
    <title>モザイク制作ナビゲーター</title>
    <link rel="stylesheet" id="dynaCSS" href="./assets/index-99caac3b.css">
    <link id="bootstrap_stylesheet" rel="stylesheet" href="./assets/cerulean.min-0d54cd93.css?used">
    <link rel="stylesheet" type="text/css" href="./css/RBstyle3.css" />
    <style>
    :root { --my-size: 1.8rem; --my-span: 560px; --my-nona: block; --my-nonr: block; --my-nocv: none; }
    #miniCube, .cpCube { transform-origin: 0 0; transform: scale(0.6); border-collapse: collapse; height:92px; width: 200px; }
    .cube { top: -30px; left: 30px; }
    .cpCube { display: var(--my-nocv); }
    .trCube { transform-style: preserve-3d; transform: rotateY(0deg); }
    .big {font-size: var(--my-size) !important}
    .big2 {font-size:1.8rem !important}
    .flex_test-box { display: flex; flex-wrap: wrap; align-content:stretch; padding: 5px; }
    .flex_test-item { display: flex; padding: 2px; margin: 0px; width: var(--my-span); flex-basis: var(--my-span); }
    .flex_test-item1 { display: flex; padding: 2px; margin: 0px; width: calc(var(--my-span) * 2); flex-basis: calc(var(--my-span) * 2); }
    .pskip { display: none; }
    .assemble { display:var(--my-nona); }
    .recover { display:var(--my-nonr); }
    @media print { button { display: none; } .pskip { display: block; } }
    .pageBreak:not(:last-child) { break-after: page; }
    .flex-row{flex-direction:row!important}
    .flex-column{flex-direction:column!important}
    .wrap { margin: 80px auto 0px; perspective: 900px; perspective-origin: 50% 0%; height: 100px; width: 88px; }
    </style>
    <script src="./js/jquery.min.js"></script>
    <script src="./js/scriptMini.js"></script>
    <script>
      pname = window.location.pathname;
      if (location.protocol=="file:") document.getElementById('dynaCSS').href=
          pname.slice(1,pname.lastIndexOf('/')) +"/assets/index-99caac3b.css";
      const sleep = time => new Promise(resolve => setTimeout(resolve, time));
      Autodown=true;
      function sel_go(str) {
          if (!window.find(str+"行 1/")) if (!window.find(str+"行 1/",true,true)) 
              document.getElementById("imgGather").scrollIntoView({ behavior: "smooth", block: "start" });; 
          sel_can();
      }
      function sel_can() { if (window.getSelection) { window.getSelection().removeAllRanges(); } }
      function downHTML(inout) {
        document.getElementById("cubeFields").innerHTML = "";
        const doctype = "<!DOCTYPE html>\\n" + document.documentElement.outerHTML.replace('Autodown=true','Autodown=false');
        const blob = new Blob([doctype], { type: 'text/html' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = inout ;
        a.click();
      }
    </script>
    `;

    // BODYの構築
    const bodyContent = `
    <div id="app">
        <div class="big2">　<span style="text-align: right;">一覧表のモード：</span>
            <span><select style="font-size: 1.5rem;" onchange="(this.value=='X')?window.close():selectNo(this.value,'DIR');">
                <option value="2">キューブで絵を作る/戻す</option>
                <option value="1">キューブで絵を作る</option>
                <option value="0">キューブ戻す(含救済)</option>
                <option value="3">キューブを作成・配置</option>
                <option value="X">初期画面に戻る</option>
            </select></span><span style="font-size: 1.2rem;">　　V5(JS)</span>
        </div>
        <nav class="navbar">
            <a class="navbar-brand clickable text-primary mx-2" onclick="accel()" title="回転緩急">　${boardSizeStr} in each</a>
            <div class="col-auto">
                <button class="btn btn-link text-primary" onclick="window.open('https://bestsiteever.net/algs_for_mosaic/','mosaic')" title="New miniature">
                                                                <i class="bi bi-file-earmark-plus font-bigger"></i></button>
                <button class="btn btn-link text-primary" onclick="slowPause()"><i class="bi-moon font-bigger bi-sun" title="一時停止/解除"></i></button></div>
            </div>
        </nav>
        <nav class="navbar sticky-top navbar-light bg-light">
            <div class="row w-100 align-items-bottom" id="navi" style="height: 160px;">
                <div style="min-width: 744px;">
                    <span id="refer" style="display: block; position: relative; top: -30px;">　　Agent generator with JS converter.@2025</span>
                    <span style="position: relative; top: -30px;">　　　　　　　<span class="lower" id="turn">&nbsp;</span>　<span class="lower" id="rotate" style="font-size: 1.6rem;"></span></span>
                </div>
                <table><tr>
                    <td>　</td>
                    <td style="position: relative; top: -30px;"><canvas height="90" id="myCanvas" onclick="downHTML('output.html')" title="HTMLファイル取得" width="60"></canvas>
                        <span class="pskip" id="imgcopy"></span></td>
                    <td id="miniCube" style="display: block;">
                        <div class="wrap"><div class="cube" onclick="faceFloat()"><div id="cubeFields"></div><div id="rotLayer"></div></div></div>
                    </td>
                    <td style="position: relative; top: -70px;">　　　　</td>
                    <td style="position: relative; top: -40px;">
                        <img src="./css/${ADface}.png" usemap="#maptest" width="96">
                        <map name="maptest">
                            <area coords=" 4, 4,44,44" href="javascript:sel_go('A面');" shape="rect"/>
                            <area coords="52, 4,92,44" href="javascript:sel_go('B面');" shape="rect"/>
                            <area coords=" 4,52,44,92" href="javascript:sel_go('C面');" shape="rect"/>
                            <area coords="52,52,92,92" href="javascript:sel_go('D面');" shape="rect"/>
                            <area coords=" 4,100,44,140" href="javascript:sel_go('E面');" shape="rect">
                            <area coords="52,100,92,140" href="javascript:sel_go('F面');" shape="rect">
                        </map>
                    </td>
                </tr></table>
            </div>
        </nav>
`;
    const nihongo = `
        <div class="container h-100 mt-1"><div class="row"><div class="col">
<div class="alert alert-info alert-dismissible fade show" id="alert" role="alert" style="display: block;">
<font _mstmutation="1" size="+2"> 行番号は上方から下方に振られ、行番号1 が一番上の行です。 各行のキューブは左から右に10個並んでおり、<br _mstmutation="1">
 B,D,F面の列番号は、10だけ大きいです。(#<button onclick="setGAN()" type="button">GAN番号変換</button>&nbsp;GAN番号は、行と列の100までの通番です。)
 <br _mstmutation="1"> このＡＬＧを適用する前に、キューブの上面中央が白、前面中央に緑となるように持ちます。 <br _mstmutation="1">
 (回転記号に慣れていない人は、記号列やキューブ図をタップして実演を参考に！　<i class="bi-moon font-bigger bi-sun" style="color: blue;"></i>で一時停止/解除）<br _mstmutation="1">
下に続く表示と印刷は段組みができます。<button onclick="setcolPad()" type="button">増欄</button>　<button onclick="setcol('1.8rem','480px')" type="button">減欄</button>
-<button onclick="Algprint()" title="拡大設定後に押下" type="button">印刷</button>　印刷様式：4P/枚 拡大180%<br _mstmutation="1">
</font></div></div>
        <div style="break-before: page;"></div>
        <div class="flex_test-box big">
            <span id="imgGather" style="display: none; scroll-margin-top: 200px;">
                <div class="flex_test-item1"><div id="imgGath" style="width: 400px;"></div></div>
            </span>
`;
    // スクリプト変数定義の注入
    const textCont = `<script>Row=${Row}; Col=${Col}; const Rimg = "${img}"; </script>`;
    outputHtml.body.outerHTML = `<body onload="canDraw();selectNo('${mode}');">` + bodyContent + textCont + nihongo + "</body>";

    // --- 4. アルゴリズム部分の処理と挿入 ---
    
    // テンプレートとなるDOM要素の作成
    const flexPack = document.createElement('span');
    flexPack.className = 'assemble';
    flexPack.innerHTML = '<div class="flex_test-item"><div class="avoidPageBreak">\n<h2>A</h2></div></div>';
    
    const flexBack = document.createElement('span');
    flexBack.className = 'recover';
    flexBack.innerHTML = '<div class="flex_test-item"><div class="avoidPageBreak">\n<h2>R</h2></div></div>';

    const insertTarget = outputHtml.getElementById("imgGather");
    const sourceBreakPoint = sourceDoc.querySelector('div[style="break-before: page;"]');
    
    // ソースHTMLからアルゴリズム行を取得
    // Python: mt2.find_all("div",{"class":"avoidPageBreak"})
    // 注意: DOM構造によっては親要素を探す必要があるが、ここでは単純化
    const ganLines = sourceDoc.querySelectorAll('div.avoidPageBreak');

    ganLines.forEach(GANline => {
        // Deep Clone
        let flexIns = flexPack.cloneNode(true);
        let flexRvs = flexBack.cloneNode(true);
        let flexIns2, flexRvs2;

        if (Col > 10) {
            flexIns2 = flexPack.cloneNode(true);
            flexRvs2 = flexBack.cloneNode(true);
        }

        const h2 = GANline.querySelector("h2").cloneNode(true); // 元のヘッダー情報

        // 行の逆順処理と挿入
        const Rline = Array.from(GANline.querySelectorAll('div[class*="row py-2"]'));
        let i = 10;
        
        for (let j = Rline.length - 1; j >= 0; j--) {
            const div = Rline[j];
            i--;
            const divIns = div.cloneNode(true);
            const divRvs = div.cloneNode(true); // 後でprocessFaceで中身が変わる

            const targetInsH2 = (Col < 11 || i < 0) ? flexIns.querySelector("h2") : flexIns2.querySelector("h2");
            const targetRvsH2 = (Col < 11 || i < 0) ? flexRvs.querySelector("h2") : flexRvs2.querySelector("h2");

            targetInsH2.after(divIns);
            targetRvsH2.after(divRvs);
        }

        // 行番号・面番号の書き換えロジック
        const rowMatch = h2.textContent.match(/Row\s+(\d+)\//);
        if (rowMatch) {
            const rowNum = parseInt(rowMatch[1]);
            let newText = "", medText = "";
            
            if (Row === 20) {
                if (rowNum <= 10) { newText = `C面行 ${11 - rowNum}/10 `; medText = `D面行 ${11 - rowNum}/10 `; }
                else if (rowNum <= 20) { newText = `A面行 ${21 - rowNum}/10 `; medText = `B面行 ${21 - rowNum}/10 `; }
            } else if (Row === 30) {
                // ... (Python版の条件分岐と同様)
                if (rowNum <= 10) { newText = `E面行 ${11 - rowNum}/10 `; medText = `F面行 ${11 - rowNum}/10 `; }
                else if (rowNum <= 20) { newText = `C面行 ${21 - rowNum}/10 `; medText = `D面行 ${21 - rowNum}/10 `; }
                else if (rowNum <= 30) { newText = `A面行 ${31 - rowNum}/10 `; medText = `B面行 ${31 - rowNum}/10 `; }
            }

            flexIns.querySelector("h2").textContent = newText + "作る";
            flexRvs.querySelector("h2").textContent = newText + "戻す";
            if (Col > 10) {
                flexIns2.querySelector("h2").textContent = medText + "作る";
                flexRvs2.querySelector("h2").textContent = medText + "戻す";
            }
        }

        // onclick付与などの処理
        if (Col > 10) {
            processFace(flexRvs2, 1, - 1);
            processFace(flexIns2, 0, - 1);
        } 
        processFace(flexRvs, 1, 0);
        processFace(flexIns, 0, 0);
    });

    // 最後に総手数を追記
    const footerMsg = outputHtml.createElement('div');
    footerMsg.innerHTML = `変換が完了しました: 出力HTMLファイルへ　　総手数: ${moveCT}`;
    outputHtml.body.appendChild(footerMsg);

    // 文字列として返す
    return "<!DOCTYPE html>\n" + outputHtml.documentElement.outerHTML;
}