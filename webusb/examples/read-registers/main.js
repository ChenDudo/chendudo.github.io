const count = 16;

const readRegisters = async (device, count) => {
    const transport = new DAPjs.WebUSB(device);
    const processor = new DAPjs.CortexM(transport);

    await processor.connect();
    await processor.halt();

    const registers = Array.from({ length: count }, (_, index) => index);
    const values = await processor.readCoreRegisters(registers);

    await processor.resume();
    await processor.disconnect();

    const result = values.map(register => ("00000000" + register.toString(16)).slice(-8));
    return result;
};

document.getElementById("read").onclick = async () => {
    const device = await navigator.usb.requestDevice({
        filters: [{ vendorId: 0x2F81 }]
    });
    const values = await readRegisters(device, count);
    values.forEach((value, index) => {
        const registerEl = document.getElementById(`r${index}`);
        registerEl.innerHTML = `Register ${index}: ${value}`;
    });
};

for (let index = 0; index < count; index++) {
    const registerEl = document.createElement("div");
    registerEl.id = `r${index}`;
    registerEl.innerHTML = `Register ${index}: None`;
    document.body.appendChild(registerEl);
}