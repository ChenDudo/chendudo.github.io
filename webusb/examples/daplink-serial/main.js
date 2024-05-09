var resultsEl = null;
var device = null;
var transport = null;
var target = null;

resultsEl = document.getElementById("results");

// Listen to serial output from the device
const listen = async (device, resultsEl) => {
    transport = new DAPjs.WebUSB(device);
    target = new DAPjs.DAPLink(transport);
    target.on(DAPjs.DAPLink.EVENT_SERIAL_DATA, data => {
        resultsEl.innerHTML += `${data}`;
    });

    await target.connect();
    const baud = await target.getSerialBaudrate();
    await target.disconnect();
    resultsEl.innerHTML = `Listening at ${baud} baud...\n`;

    target.startSerialRead();
};

document.getElementById("connect").onclick = async () => {
    try {
        device = await navigator.usb.requestDevice({
            filters: [{ vendorId: 0x2F81 }]
        });
    } catch (err) {
        return
    };
    listen(device, resultsEl);
};

document.getElementById("disConnect").onclick = async () => {
    resultsEl.innerHTML += `Try to disconnect....\n`;
    await target.disconnect();
}
