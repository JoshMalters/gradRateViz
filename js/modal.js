/**
 * Created by Josh on 2/20/17.
 */
// Get the modal
var modal = document.getElementById('myModal');

// Get the button that opens the modal
var btn = document.getElementById("addTag");

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

// When the user clicks on the button, open the modal
btn.onclick = function() {
    $('#myModal').fadeIn(200);
}

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
    $('#myModal').fadeOut(100);
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
    if (event.target == modal) {
        $('#myModal').fadeOut(100);
    }
}