class MapEditor {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.mapSelect = document.getElementById("mapSelect");
        this.imageUrl = localStorage.getItem("map") || this.mapSelect[0].value;
        this.data = this.loadData();
        this.mapImage = document.getElementById("mapImage");
        this.exportButton = document.getElementById("exportButton");
        this.deleteButton = document.getElementById("deleteButton");
        this.sampleButton = document.getElementById("sampleButton");

        this.exportButton.addEventListener("click", () => this.exportData());
        this.deleteButton.addEventListener("click", () => this.deleteData());
        this.sampleButton.addEventListener("click", () => this.sampleData());
        this.mapImage.addEventListener("click", (e) => this.handleClick(e));

        this.draggingIndex = null;
        this.dragOffset = { x: 0, y: 0 };

        this.mapImage.addEventListener("load", () => {
            this.render();
        });

        if (this.mapImage.complete) {
            this.render();
        }

        window.addEventListener(
            "resize",
            () => {
                this.render();
            },
            false
        );

        this.mapImage.src = this.imageUrl;
        this.mapSelect.value = this.imageUrl;
    }

    changeMap(event) {
        this.imageUrl = event.target.value;
        localStorage.setItem("map", this.imageUrl);
        this.mapImage.src = this.imageUrl;
    }

    handleClick(event) {
        const rect = this.mapImage.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;

        this.openInputForm((values) => {
            if (values.length > 0) {
                this.data.push({ x, y, text: values.join(",") });
                this.saveData();
                this.render();
            }
        });
    }

    editLabel(index) {
        const current = this.data[index].text.split(",");
        this.openInputForm((values) => {
            if (values.length === 0) {
                this.data.splice(index, 1);
            } else {
                this.data[index].text = values.join(",");
            }
            this.saveData();
            this.render();
        }, current);
    }

    openInputForm(callback, initialValues = []) {
        const modal = document.getElementById("inputModal");
        const fieldsContainer = document.getElementById("inputFields");
        const saveBtn = document.getElementById("saveBtn");
        const cancelBtn = document.getElementById("cancelBtn");
        const deleteBtn = document.getElementById("deleteBtn");

        fieldsContainer.innerHTML = "";

        const wrapper = document.createElement("div");
        wrapper.classList.add("number-input-wrapper", "w-100");

        const input = document.createElement("input");
        input.type = "text";
        input.name = "hidden-number-input";
        input.inputMode = "numeric";
        input.autocomplete = "off";
        input.maxLength = 30;
        input.classList.add("hidden-number-input");

        const visualContainer = document.createElement("div");
        visualContainer.classList.add("visual-code-input", "w-100", "d-flex", "flex-wrap", "gap-2");

        wrapper.appendChild(input);
        wrapper.appendChild(visualContainer);
        fieldsContainer.appendChild(wrapper);

        const allowedLetters = ["g", "s", "k", "d", "h", "r", "x"];
        let internal = [];
        let activeIndex = 0;

        const render = () => {
            visualContainer.innerHTML = "";
            internal.forEach(({ digit, letter }, index) => {
                const box = document.createElement("div");
                box.classList.add("code-box", "rounded", "d-flex", "justify-content-center", "align-items-center");
                if (index === activeIndex) {
                    box.classList.add("active", `active-${letter || "default"}`);
                }
                box.textContent = digit || "";
                box.style.backgroundColor = this.getColor(letter);
                box.title = letter || "";
                visualContainer.appendChild(box);
            });

            if (activeIndex === internal.length) {
                const active = document.createElement("div");
                active.classList.add(
                    "code-box",
                    "rounded",
                    "d-flex",
                    "justify-content-center",
                    "align-items-center",
                    "active",
                    "active-default"
                );
                visualContainer.appendChild(active);
            }
        };

        input.addEventListener("input", () => {
            const raw = input.value.replace(/\D/g, "");
            for (let digit of raw) {
                if (internal[activeIndex]) {
                    internal[activeIndex].digit = digit;
                } else {
                    internal.push({ digit, letter: "x" });
                }
                activeIndex = Math.min(activeIndex + 1, internal.length);
            }
            input.value = "";
            render();
        });

        input.addEventListener("keydown", (e) => {
            if (e.key === "Backspace") {
                if (internal.length === 0) return;

                internal.splice(activeIndex, 1);
                activeIndex = Math.max(0, activeIndex - 1);

                e.preventDefault();
                render();
                return;
            }

            if (e.key === "ArrowRight") {
                e.preventDefault();
                activeIndex = Math.min(activeIndex + 1, internal.length);
                render();
                return;
            }

            if (e.key === "ArrowLeft") {
                e.preventDefault();
                activeIndex = Math.max(activeIndex - 1, 0);
                render();
                return;
            }

            if (e.key === "Home") {
                activeIndex = 0;
                render();
                e.preventDefault();
                return;
            }

            if (e.key === "End") {
                activeIndex = internal.length;
                render();
                e.preventDefault();
                return;
            }

            if (allowedLetters.includes(e.key)) {
                if (internal[activeIndex]) {
                    internal[activeIndex].letter = e.key;
                } else {
                    internal.splice(activeIndex, 0, { digit: "", letter: e.key });
                }
                render();
                e.preventDefault();
                return;
            }

            if (e.key === "Escape") {
                e.preventDefault();
                modal.style.display = "none";
            }

            if (e.key === "Enter") {
                e.preventDefault();
                saveBtn.click();
            }
        });

        visualContainer.addEventListener("click", () => input.focus());

        for (let val of initialValues) {
            const match = val.match(/^(\d+)([a-zA-Z]?)$/);
            if (match) {
                const digits = match[1];
                const letter = match[2] || "";
                for (let ch of digits) {
                    internal.push({ digit: ch, letter });
                }
            }
        }

        activeIndex = Math.max(0, Math.min(activeIndex, internal.length));
        render();
        setTimeout(() => input.focus(), 0);

        saveBtn.onclick = () => {
            const values = [];
            let buffer = "";
            let currentLetter = "";
            for (const item of internal) {
                if (currentLetter && currentLetter !== item.letter) {
                    values.push(buffer + currentLetter);
                    buffer = "";
                }
                buffer += item.digit;
                currentLetter = item.letter;
            }
            if (buffer) {
                values.push(buffer + currentLetter);
            }
            modal.style.display = "none";
            callback(values);
        };

        cancelBtn.onclick = () => {
            modal.style.display = "none";
        };

        deleteBtn.onclick = () => {
            callback([]);
            modal.style.display = "none";
        };

        modal.style.display = "block";
    }

    render() {
        if (this.draggingIndex === null) this.renderLabels();
        else this.renderSingleLabel(this.draggingIndex);
    }

    renderLabels() {
        const div = document.getElementById("mapLabels");
        this.clearLabels(div);

        this.data.forEach((item, index) => {
            const label = this.createLabel(item);
            label.style.position = "absolute";
            label.setAttribute("data-index", index);
            div.appendChild(label);

            this.positionLabel(label, item);
            this.attachLabelEvents(label, index);
        });
    }

    renderSingleLabel(index) {
        const item = this.data[index];
        const div = document.getElementById("mapLabels");
        this.clearSingleLabel(index);

        const label = this.createLabel(item);
        label.style.position = "absolute";
        label.setAttribute("data-index", index);
        div.appendChild(label);

        this.positionLabel(label, item);
        this.attachLabelEvents(label, index);
    }

    clearSingleLabel(index) {
        const div = document.getElementById("mapLabels");
        const label = div.querySelector(`[data-index="${index}"]`);
        if (label) {
            label.remove();
        }
    }

    clearLabels(div) {
        div.querySelectorAll(".mapLabel").forEach((el) => el.remove());
    }

    createLabel(item) {
        const label = document.createElement("div");
        label.classList.add("mapLabel", "rounded");

        const numbers = item.text.split(",");
        numbers.forEach((num) => {
            const numberLabel = document.createElement("span");
            numberLabel.textContent = num.split(/[a-zA-Z]/)[0];
            numberLabel.style.color = this.getColor(num);
            label.appendChild(numberLabel);
        });

        return label;
    }

    positionLabel(label, item) {
        const rect = this.mapImage.getBoundingClientRect();
        const labelRect = label.getBoundingClientRect();

        const left = Math.min(Math.max(item.x * rect.width, 0), rect.width - labelRect.width);
        const top = Math.min(Math.max(item.y * rect.height, 0), rect.height - labelRect.height);

        label.style.left = `${left}px`;
        label.style.top = `${top}px`;
    }

    attachLabelEvents(label, index) {
        let clicked = true;

        label.onclick = () => {
            if (clicked) this.editLabel(index);
        };

        label.onmousedown = (e) => this.startDrag(e, label, index);
    }

    startDrag(e, label, index) {
        e.preventDefault();

        this.draggingIndex = index;
        const rect = this.mapImage.getBoundingClientRect();
        const labelRect = label.getBoundingClientRect();

        const onMouseMove = (moveEvent) => {
            if (this.draggingIndex === null) return;

            const x = (moveEvent.clientX - rect.left - labelRect.width / 2) / rect.width;
            const y = (moveEvent.clientY - rect.top - labelRect.height / 2) / rect.height;

            this.data[this.draggingIndex].x = Math.min(Math.max(x, 0), 1);
            this.data[this.draggingIndex].y = Math.min(Math.max(y, 0), 1);

            this.render();
        };

        const onMouseUp = () => {
            this.draggingIndex = null;
            this.saveData();
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
        };

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
    }

    debounceRender = (() => {
        let timeout;
        return () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => this.renderLabels(), 50);
        };
    })();

    getColor(text) {
        const letter = text[text.length - 1];
        switch (letter) {
            case "g":
                return "#2196F3";
            case "s":
                return "#E53935";
            case "k":
                return "#8BC34A";
            case "d":
                return "#78909C";
            case "h":
                return "#9575CD";
            case "r":
                return "#FFC107";
            case "x":
            default:
                return "#EFEFEF";
        }
    }

    sampleData() {
        const sampleFile = "sample/sample_red_deer_te_awaroa.json";
        fetch(sampleFile)
            .then((response) => response.json())
            .then((data) => {
                this.data = data;
                this.saveData();
                this.render();
            })
            .catch((error) => {
                console.error("Error loading sample data:", error);
            });
        this.changeMap({ target: { value: "maps/tanp.png" } });
        this.saveData();
        this.render();
    }

    deleteData() {
        this.data = [];
        this.saveData();
        this.render();
    }

    saveData() {
        localStorage.setItem("data", JSON.stringify(this.data));
    }

    loadData() {
        return JSON.parse(localStorage.getItem("data")) || [];
    }

    exportData() {
        let name = document.getElementById("fileName").value;
        if (!name) name = "data";
        const fileName = `${name}.json`;
        const blob = new Blob([JSON.stringify(this.data, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            this.data = JSON.parse(e.target.result);
            this.saveData();
            this.render();
        };
        reader.readAsText(file);
    }
}

const editor = new MapEditor("mapContainer");
