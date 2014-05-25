var gulp = require('gulp'),
    livereload = require('gulp-livereload');

gulp.task('dev', function()
{
    var server = livereload();

    gulp.watch('*.js').on('change', function(file)
    {
        server.changed(file.path);
    });

    gulp.watch('*.html').on('change', function(file)
    {
        server.changed(file.path);
    });
});

// Default task
gulp.task('default', ['dev']);