function infoClassToggle() {
    const info__container = document.getElementsByClassName("info__container")[0];
    const info__container__image = document.getElementsByClassName("info__container__image")[0];
    const info__container__text = document.getElementsByClassName("info__container__text")[0];
    info__container.classList.toggle("info__container--active");
    info__container__image.classList.toggle("info__container__image--active");
    info__container__text.classList.toggle("info__container__text--active");
}