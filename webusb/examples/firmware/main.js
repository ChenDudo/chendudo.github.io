; (function () {
    if (!('serial' in navigator)) {
        alert('请注意，当前浏览器不支持：\n- 在线串口\n- 拖拽下载 / 恢复出厂\n请用 Edge 或 Chrome 浏览器打开.')
    }
    let dropEl = document.getElementById("drop");
    let fileEl = document.getElementById("file");
    let selectEl = document.getElementById("select");
    let choosebuttonEI = document.getElementById("choosebutton");
    let labelEl = document.getElementById("label");
    let statusEl = document.getElementById("status");
    let transferEl = document.getElementById("transfer");
    let barEl = document.getElementById("bar");
    let buffer = null;
    let textDetail = null;

    // new add Board Function follow:
    let eleRecoryF0050 = document.getElementById("idRecoryF0050")
    eleRecoryF0050.addEventListener("click", function recory_F0050() {
        getRemoteBlob("./src/F0050/Mini-F0050-OB_V1.hex");
    });
    let eleRecoryF5280 = document.getElementById("idRecoryF5280")
    eleRecoryF5280.addEventListener("click", function recory_F5280() {
        getRemoteBlob("./src/F5280/firmware.hex");
    });
    let eleRecoryG0020 = document.getElementById("idRecoryG0020")
    eleRecoryG0020.addEventListener("click", function recory_G0020() {
        getRemoteBlob("./src/G0020/firmware.hex");
    });
    let eleRecoryF0120 = document.getElementById("idRecoryF0120")
    eleRecoryF0120.addEventListener("click", function recory_F0120() {
        getRemoteBlob("./src/F0120/firmware.hex");
    });
    let eleRecoryWB0510 = document.getElementById("idRecoryWB0510")
    eleRecoryWB0510.addEventListener("click", function recory_WB0510() {
        getRemoteBlob("./src/WB0510/firmware.hex");
    });
    let eleRecoryG0001 = document.getElementById("idRecoryG0001")
    eleRecoryG0001.addEventListener("click", function recory_G0001() {
        getRemoteBlob("./src/G0001/firmware.hex");
    });
    let eleRecoryG5330 = document.getElementById("idRecoryG5330")
    eleRecoryG5330.addEventListener("click", function recory_G5330() {
        getRemoteBlob("./src/G5330/firmware.hex");
    });
    let eleRecoryF5270 = document.getElementById("idRecoryF5270")
    eleRecoryF5270.addEventListener("click", function recory_F5270() {
        getRemoteBlob("./src/F5270/firmware.hex");
    });


    // Test Pass: by ChenDo 20230523
    function getRemoteBlob(filepath) {
        var xhr = new XMLHttpRequest();

        xhr.withCredentials = true;
        xhr.open("GET", filepath);
        xhr.send();
        xhr.onreadystatechange = () => {
            console.log('read state=>', xhr.readyState)
        }
        xhr.onreadystatechange = function () {
            console.log("xhr.readyState=" + xhr.readyState + ", xhr.status=" + xhr.status);
            if (xhr.readyState === 4 && xhr.status === 200) {
                let textDetail = xhr.responseText;
                setImage(new Blob([textDetail], { type: "text/plain" }));
                selectDevice();
            }
        }
        xhr.onerror = function (error) {
            console.log(error)
            setStatus("Getting Remote Data meet Something Error ...");
        };
    }

    // origin
    const setStatus = state => {
        labelEl.textContent = state;
    }

    const setTransfer = progress => {
        if (!progress) {
            statusEl.style.visibility = "hidden";
            return;
        }
        selectEl.style.visibility = "hidden";
        statusEl.style.visibility = "visible";
        barEl.style.width = `${progress * 100}%`;
        transferEl.textContent = `${Math.ceil(progress * 100)}%`;
    }

    // Load a firmware image
    const setImage = (file) => {
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = evt => {
            buffer = evt.target.result;
            if (file.name) {
                setStatus(`Firmware image: ${file.name}`);
            }
            else {
                setStatus(`Firmware image: Remote Firmware`);
            }
            selectEl.style.visibility = "visible";
        }
        reader.readAsArrayBuffer(file);
    }

    // Choose a device
    const selectDevice = async () => {
        setStatus("Selecting device...");
        setTransfer();

        try {
            const device = await navigator.usb.requestDevice({
                filters: [{ vendorId: 0x2F81 }]
            });
            await update(device);
        } catch (error) {
            statusEl.style.visibility = "hidden";
            setStatus(error);
        }
    }

    // Update a device with the firmware image
    const update = async device => {
        if (!buffer) return;

        const transport = new DAPjs.WebUSB(device);
        const target = new DAPjs.DAPLink(transport);

        target.on(DAPjs.DAPLink.EVENT_PROGRESS, progress => {
            setTransfer(progress);
        });

        try {
            // Push binary to board
            setStatus(`Flashing binary file ${buffer.byteLength} words long...`);
            await target.connect();
            await target.flash(buffer);

            setStatus("Disconnecting...");
            await target.disconnect();

            setStatus("Flash complete!");
            setTransfer();
            fileEl.value = "";
        } catch (error) {
            statusEl.style.visibility = "hidden";
            setStatus(error);
        }
    }

    fileEl.addEventListener("change", event => {
        setImage(event.target.files[0]);
        selectDevice();
    });

    dropEl.addEventListener("drop", event => {
        setImage(event.dataTransfer.files[0]);
        selectDevice();
    });

    choosebuttonEI.addEventListener("click", selectDevice);

    ["drag", "dragstart", "dragend", "dragover", "dragenter", "dragleave", "drop"].forEach(eventName => {
        dropEl.addEventListener(eventName, event => {
            event.preventDefault();
            event.stopPropagation();
        });
    });

    ["dragover", "dragenter"].forEach(eventName => {
        dropEl.addEventListener(eventName, event => {
            dropEl.classList.add("hover");
        });
    });

    ["dragleave", "dragend", "drop"].forEach(eventName => {
        dropEl.addEventListener(eventName, event => {
            dropEl.classList.remove("hover");
        });
    });

    function download() {
        var url = 'https://chendo.gitee.io/webusb/examples/firmware/src/G0001/firmware.hex';
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true); // 异步
        xhr.responseType = 'blob'; // blob 类型
        xhr.onload = function () {
            if (xhr.status != 200) {
                alert('下载异常！');
                return;
            }
            if (window.navigator.msSaveOrOpenBlob) {
                // IE
                navigator.msSaveBlob(xhr.response, filename);
            } else {
                var newUrl = window.URL.createObjectURL(xhr.response);
                var a = document.createElement('a');
                a.setAttribute('href', newUrl);
                a.setAttribute('target', '_blank');
                a.setAttribute('download', ''); // 自定义文件名（有效）
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
        };
        xhr.send();
    }
})()