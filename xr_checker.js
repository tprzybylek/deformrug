// First, let's check if the protocol is secure (HTTPS)
if (location.protocol === "https:") {
    navigator.xr.isSessionSupported('immersive-ar') // Then, let's check if the desired xr session (in our case, 'immersive-ar' session) is availible
    .then((isSupported) => {
        if (isSupported) {
            xr_checker = true;
            // Let's edit the button to display the correct call to action
            const init_button = document.getElementsByClassName("button__container")[0];
            init_button.innerHTML = '<button class="button__container__xr" onclick="activateXR()"><img src="./build/ar_icon.svg" alt="Icon showing that augmented reality functionality is availible."></button>'
        } else {
            xr_checker = false;
        }
    });
}