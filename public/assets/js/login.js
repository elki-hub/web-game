(function() {
    "use strict";

    $(function() {
        $("form[name='login']").validate({
            rules: {
                email: {
                    required: true,
                    email: true
                },
                password: {
                    required: true,
                }
            },

            messages: {
                email: "Please enter a valid email address",

                password: {
                    required: "Please enter password",
                }

            },

            submitHandler: function(form) {
                form.submit();
            }
        });
    });

    $(function() {

        $("form[name='registration']").validate({
            rules: {
                nickname: {
                    required: true,
                    maxlength: 15
                },
                email: {
                    required: true,
                    email: true
                },
                password: {
                    required: true,
                    minlength: 5
                },
                conf_password: {
                    required: true,
                    equalTo: "#password"
                },
            },

            messages: {
                nickname: {
                    required: "Please enter your nickname",
                    maxLength: "Nickname is too long"
                },
                email: "Please enter a valid email address",
                password: {
                    required: "Please provide a password",
                    minlength: "Your password must be at least 5 characters long"
                },
                conf_password: {
                    required: "Please repeat the password",
                    equalTo: "Please make sure your passwords match"
                },
            },

            submitHandler: function(form) {
                form.submit();
            }
        });
    });

})()