// Group UI module: manages group name, people chips, add/remove person, sample trip, and reset.

import { LIMITS, cleanText, renameGroup, addPerson, removePerson, newGroup, fmt } from "./engine/split.js";
import { sampleGroup } from "./sample-data.js";
import { clearGroup } from "./store.js";
import { t } from "./copy.js";

// Helper to extract initials (up to 2 letters)
function getInitials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return [...parts[0]].slice(0, 2).join("").toUpperCase();
  const first = [...parts[0]][0] || "";
  const last = [...parts[parts.length - 1]][0] || "";
  return (first + last).toUpperCase();
}

export function renderGroupCard(container, { group, onUpdateGroup, isViewing = false }) {
  // Clear container safely
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  const root = document.createElement("div");
  root.className = "group-ui-wrapper";

  // 1. Group Name Field
  const nameGroup = document.createElement("div");
  nameGroup.className = "form-group";

  const nameLabel = document.createElement("label");
  nameLabel.className = "form-label";
  nameLabel.htmlFor = "group-name-input";
  nameLabel.textContent = t("group.label");

  const nameInput = document.createElement("input");
  nameInput.id = "group-name-input";
  nameInput.type = "text";
  nameInput.className = "form-input";
  nameInput.placeholder = t("group.placeholder");
  nameInput.value = group.name || "";
  nameInput.maxLength = LIMITS.groupNameLength;
  if (isViewing) nameInput.disabled = true;

  const nameError = document.createElement("div");
  nameError.className = "form-error";
  nameError.setAttribute("aria-live", "polite");

  const handleRename = function () {
    if (isViewing) return;
    const val = cleanText(nameInput.value);
    if (val === group.name) {
      nameError.textContent = "";
      return;
    }
    const res = renameGroup(group, val);
    if (!res.ok) {
      nameError.textContent = t("reasons.groupName");
      nameInput.classList.remove("field-shake");
      void nameInput.offsetWidth;
      nameInput.classList.add("field-shake");
    } else {
      nameError.textContent = "";
      onUpdateGroup(res.group);
    }
  };

  nameInput.addEventListener("blur", handleRename);
  nameInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleRename();
      nameInput.blur();
    }
  });

  nameGroup.appendChild(nameLabel);
  nameGroup.appendChild(nameInput);
  nameGroup.appendChild(nameError);
  root.appendChild(nameGroup);

  // 2. People Section
  const peopleSection = document.createElement("div");
  peopleSection.className = "people-section";

  const peopleHeader = document.createElement("div");
  peopleHeader.className = "people-header";

  const peopleTitle = document.createElement("span");
  peopleTitle.className = "form-label";
  peopleTitle.textContent = t("group.people");

  const peopleCount = document.createElement("span");
  peopleCount.className = "people-count-badge tabular-nums";
  peopleCount.textContent = t("group.count", {
    count: fmt(group.people.length),
    max: fmt(LIMITS.people)
  });

  peopleHeader.appendChild(peopleTitle);
  peopleHeader.appendChild(peopleCount);
  peopleSection.appendChild(peopleHeader);

  // Add person input row (hidden in viewing mode)
  const personError = document.createElement("div");
  personError.className = "form-error";
  personError.setAttribute("aria-live", "polite");

  if (!isViewing) {
    const addRow = document.createElement("div");
    addRow.className = "add-person-row";

    const personInput = document.createElement("input");
    personInput.id = "add-person-input";
    personInput.type = "text";
    personInput.className = "form-input";
    personInput.placeholder = t("group.personPlaceholder");
    personInput.maxLength = LIMITS.nameLength;

    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "btn btn-secondary btn-sm";
    addBtn.textContent = t("group.add");

    const handleAddPerson = function () {
      const rawName = personInput.value;
      const res = addPerson(group, rawName);
      if (!res.ok) {
        const clean = cleanText(rawName);
        personError.textContent = t("reasons.person." + res.reason, { name: clean });
        personInput.classList.remove("field-shake");
        void personInput.offsetWidth;
        personInput.classList.add("field-shake");
      } else {
        personError.textContent = "";
        personInput.value = "";
        onUpdateGroup(res.group);
      }
    };

    addBtn.addEventListener("click", handleAddPerson);
    personInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAddPerson();
      }
    });

    addRow.appendChild(personInput);
    addRow.appendChild(addBtn);
    peopleSection.appendChild(addRow);
  }

  peopleSection.appendChild(personError);

  // People chips list
  const chipsContainer = document.createElement("div");
  chipsContainer.className = "people-chips-container";

  group.people.forEach(function (person, index) {
    const chip = document.createElement("div");
    chip.className = "chip person-chip pop-in";

    const avatar = document.createElement("span");
    avatar.className = "avatar av-" + ((index % 8) + 1);
    avatar.textContent = getInitials(person.name);

    const nameSpan = document.createElement("span");
    nameSpan.className = "person-chip-name truncate";
    nameSpan.textContent = person.name;

    chip.appendChild(avatar);
    chip.appendChild(nameSpan);

    if (!isViewing) {
      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "person-remove-btn";
      removeBtn.setAttribute("aria-label", t("group.remove", { name: person.name }));
      removeBtn.textContent = "\u00D7"; // standard multiplication sign ×

      removeBtn.addEventListener("click", function () {
        const res = removePerson(group, person.id);
        if (!res.ok) {
          personError.textContent = t("reasons.person." + res.reason, { name: person.name });
          chip.classList.remove("field-shake");
          void chip.offsetWidth;
          chip.classList.add("field-shake");
        } else {
          personError.textContent = "";
          onUpdateGroup(res.group);
        }
      });

      chip.appendChild(removeBtn);
    }

    chipsContainer.appendChild(chip);
  });

  peopleSection.appendChild(chipsContainer);

  // Need at least 2 people warning if count < 2
  if (group.people.length < 2) {
    const needTwoBanner = document.createElement("div");
    needTwoBanner.className = "need-two-banner";
    needTwoBanner.textContent = t("group.needTwo");
    peopleSection.appendChild(needTwoBanner);
  }

  root.appendChild(peopleSection);

  // 3. Bottom Actions: Sample Trip and Reset Group (hidden in viewing mode)
  if (!isViewing) {
    const bottomActions = document.createElement("div");
    bottomActions.className = "group-bottom-actions";

    // "Try a sample trip" shows only when group has no payments
    if (group.expenses.length === 0) {
      const sampleBtn = document.createElement("button");
      sampleBtn.type = "button";
      sampleBtn.className = "btn btn-ghost btn-sm sample-trip-btn";
      sampleBtn.textContent = t("group.sample");
      sampleBtn.addEventListener("click", function () {
        onUpdateGroup(sampleGroup());
      });
      bottomActions.appendChild(sampleBtn);
    }

    // "Start a new group" button with inline confirm
    const resetWrapper = document.createElement("div");
    resetWrapper.className = "reset-group-wrapper";

    const resetBtn = document.createElement("button");
    resetBtn.type = "button";
    resetBtn.className = "btn btn-ghost btn-sm reset-trigger-btn";
    resetBtn.textContent = t("group.reset");

    const confirmBox = document.createElement("div");
    confirmBox.className = "inline-confirm-box hidden";

    const confirmMsg = document.createElement("p");
    confirmMsg.className = "inline-confirm-msg";
    confirmMsg.textContent = t("group.resetConfirm");

    const confirmActions = document.createElement("div");
    confirmActions.className = "inline-confirm-actions";

    const yesBtn = document.createElement("button");
    yesBtn.type = "button";
    yesBtn.className = "btn btn-primary btn-sm";
    yesBtn.textContent = t("group.resetYes");
    yesBtn.addEventListener("click", function () {
      clearGroup();
      onUpdateGroup(newGroup(""));
    });

    const noBtn = document.createElement("button");
    noBtn.type = "button";
    noBtn.className = "btn btn-secondary btn-sm";
    noBtn.textContent = t("group.resetNo");
    noBtn.addEventListener("click", function () {
      confirmBox.classList.add("hidden");
    });

    confirmActions.appendChild(yesBtn);
    confirmActions.appendChild(noBtn);
    confirmBox.appendChild(confirmMsg);
    confirmBox.appendChild(confirmActions);

    resetBtn.addEventListener("click", function () {
      confirmBox.classList.toggle("hidden");
    });

    resetWrapper.appendChild(resetBtn);
    resetWrapper.appendChild(confirmBox);
    bottomActions.appendChild(resetWrapper);

    root.appendChild(bottomActions);
  }

  container.appendChild(root);
}
