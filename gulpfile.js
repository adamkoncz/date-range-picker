var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    less = require('gulp-less'),
    minifyCSS = require('gulp-minify-css'),
    exec = require('child_process').execSync,
    path = require('path');


//copy .ts into ./dist
gulp.task('make-ts', function (callback) {
    var error;
    try {
        exec('tsc -p .');
    } catch (err) {
        error = err;
    }
    callback();

});

gulp.task('make-less', function () {
    return gulp.src(['./src/*.less'])
        .pipe(less())
        .pipe(minifyCSS({ processImport: false }))
        .pipe(gulp.dest('./dist'));


});

gulp.task('uglify', ['make-ts'], function () {
    return gulp.src(['./dist/**/*.js', '!./dist/**/*.min.js'])
        .pipe(uglify())
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('./dist'));
});

gulp.task('build', ['make-less', 'uglify'], function () {
    //do stuff here  
    console.log('BUILD DONE')
});