var gulp = require('gulp');
var exec = require('child_process').exec;

gulp.task('default', function(cb) {

    exec('npm test', (stdout,stderr) => {
        console.log(stdout);
        console.error(stderr);
    });

    cb();
});