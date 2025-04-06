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

        const createField = (value = "") => {
            const wrapper = document.createElement("div");
            wrapper.classList.add("col", "p-1");

            const input = document.createElement("input");
            input.type = "text";
            input.maxLength = 1;
            input.classList.add("info-input", "w-100", "text-center", "border-0", "rounded");

            const initialNumber = value.match(/^\d+/)?.[0] || "";
            const initialLetter = value.match(/[a-zA-Z]$/)?.[0] || "";
            input.value = initialNumber;
            input.setAttribute("data-internal", initialNumber + initialLetter);
            input.style.backgroundColor = this.getColor(initialLetter);

            input.addEventListener("input", () => {
                const onlyDigits = input.value.replace(/\D/g, "");
                const currentLetter = input.getAttribute("data-internal").match(/[a-zA-Z]$/)?.[0] || "";
                input.setAttribute("data-internal", onlyDigits + currentLetter);
                input.value = onlyDigits;
                input.style.backgroundColor = this.getColor(currentLetter);
                if (input.value.length !== 0) {
                    const newField = createField();
                    fieldsContainer.appendChild(newField);
                    setTimeout(() => {
                        newField.querySelector("input").focus();
                    }, 0);
                }
            });

            input.addEventListener("keydown", (e) => {
                const inputs = Array.from(fieldsContainer.querySelectorAll("input"));

                if (e.key === "ArrowRight") {
                    e.preventDefault();
                    const index = inputs.indexOf(input);

                    const isLast = index === inputs.length - 1;
                    const isEmpty = input.value === "";

                    if (isEmpty && isLast) {
                        return;
                    }

                    if (isEmpty && inputs.length > 1) {
                        wrapper.remove();
                        const newInputs = Array.from(fieldsContainer.querySelectorAll("input"));
                        const next = newInputs[Math.min(index, newInputs.length - 1)];
                        if (next) next.focus();
                        return;
                    }

                    if (isLast) {
                        const newField = createField();
                        fieldsContainer.appendChild(newField);
                        setTimeout(() => {
                            newField.querySelector("input").focus();
                        }, 0);
                    } else {
                        inputs[index + 1]?.focus();
                    }
                }

                if (e.key === "ArrowLeft") {
                    e.preventDefault();
                    const index = inputs.indexOf(input);

                    if (input.value === "" && fieldsContainer.children.length > 1) {
                        wrapper.remove();
                        const newInputs = Array.from(fieldsContainer.querySelectorAll("input"));
                        const prev = newInputs[Math.max(index - 1, 0)];
                        if (prev) prev.focus();
                        return;
                    }

                    if (index > 0) {
                        inputs[index - 1]?.focus();
                    }
                }

                if (e.key === "Backspace" && input.value === "") {
                    const wrappers = Array.from(fieldsContainer.children);
                    const index = wrappers.indexOf(wrapper);
                    if (wrappers.length > 1) {
                        e.preventDefault();
                        wrapper.remove();
                        const newWrappers = Array.from(fieldsContainer.children);
                        const previous = newWrappers[Math.max(index - 1, 0)];
                        if (previous) previous.querySelector("input").focus();
                    }
                }

                const allowedLetters = ["g", "s", "k", "d", "h", "r"];
                if (allowedLetters.includes(e.key)) {
                    e.preventDefault();
                    const onlyDigits = input.value.replace(/\D/g, "");
                    input.setAttribute("data-internal", onlyDigits + e.key);
                    input.style.backgroundColor = this.getColor(e.key);
                }

                if (e.key === "x") {
                    e.preventDefault();
                    const onlyDigits = input.value.replace(/\D/g, "");
                    input.setAttribute("data-internal", onlyDigits);
                    input.style.backgroundColor = this.getColor("");
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

            wrapper.appendChild(input);
            return wrapper;
        };

        initialValues.forEach((val) => fieldsContainer.appendChild(createField(val)));
        if (initialValues.length === 0) {
            fieldsContainer.appendChild(createField());
        }

        setTimeout(() => {
            const firstInput = fieldsContainer.querySelector("input");
            if (firstInput) firstInput.focus();
        }, 0);

        saveBtn.onclick = () => {
            const values = Array.from(fieldsContainer.querySelectorAll("input"))
                .filter((input) => input.value)
                .map((input) => input.getAttribute("data-internal") || "")
                .map((v) => v.trim())
                .filter((v) => v);
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
        label.classList.add("mapLabel", "rounded", "px-1");

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
        if (letter === "g") return "#2196F3"; // group member
        if (letter === "s") return "#E53935"; // solo

        if (letter === "k") return "#8BC34A"; // keep until herd-management is almost done
        if (letter === "d") return "#78909C"; // done solo difficulty reduction
        if (letter === "h") return "#9575CD"; // harvested

        if (letter === "r") return "#FFC107"; // rare
        return "#EFEFEF"; // default
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
