// WebUSB and DAP
var device = null;
var transport = null;
var processor = null;
var rtt = null;

// terminal
var term = null;
var line_input = "";
var cmd = "";

// control
var connected = false;

// start/stop button
document.getElementById("control").onclick = async () => {
    if (!connected) {
        // locate debug probe
        try {
            device = await navigator.usb.requestDevice({
                filters: [{ vendorId: 0x2F81 }]
            });
        } catch (err) {
            return
        };

        transport = new DAPjs.WebUSB(device);
        processor = new DAPjs.CortexM(transport);

        // connect to target and reset it
        await processor.connect();
        await processor.softReset();
        await new Promise(resolve => setTimeout(resolve, 1000));
        await processor.halt();
        console.log('Connected.');

        // locate RTT buffers
        rtt = new RTT(processor);
        numBufs = await rtt.init();
        if (numBufs < 0)
            return;
        console.log("RTT up buffers:", rtt.bufUp);
        console.log("RTT down buffers:", rtt.bufDown);
        await processor.resume();

        document.getElementById("control").innerHTML = 'stop RTT';
        connected = true;
    } else {
        connected = false;
        rtt = null;
        await processor.disconnect();
        await transport.close();
        await device.close();
        term.reset();
        document.getElementById("control").innerHTML = 'start RTT';
        console.log('Disconnected.');
    }
};

// process terminal keystroke
function processKey(e) {
    if (!connected)
        return;

    const ev = e.domEvent;
    const printable = !ev.altKey && !ev.ctrlKey && !ev.metaKey;

    if (ev.keyCode === 13) { // process newline
        if (line_input.length) {
            term.write('\r\n');
            cmd = line_input;
            console.log('sending: \"' + line_input + '\"');
            line_input = "";
        }
    } else if (ev.keyCode === 8) { // process backspace
        if (term._core.buffer.x > 0) {
            term.write('\b \b');
            line_input = line_input.slice(0, -1);
        }
    } else if (printable) { // printable chars
        term.write(e.key);
        line_input += e.key;
    }
}

// main loop
async function mainLoop() {
    // set up terminal
    term = new Terminal();
    term.setOption("theme", {
        background: "#202B33",
        foreground: "#F5F8FA"
    });
    term.onKey(processKey);
    term.open(document.getElementById('terminal'));
    term.reset();


    while (true) {
        if (!connected) {
            await new Promise(resolve => setTimeout(resolve, 100));
            continue;
        }

        // read from target
        msg = await rtt.read(0);
        if (msg.length > 0) {
            term.write(new TextDecoder().decode(msg));
        }

        // send to target
        if (cmd.length) {
            cmdBytes = new TextEncoder().encode(cmd + "\r\n");
            ret = await rtt.write(0, cmdBytes);
            if (ret < 0)
                console.log("cannot write", cmdBytes, "chars");
            cmd = "";
        }

        await new Promise(resolve => setTimeout(resolve, 1));
    }
}

mainLoop();