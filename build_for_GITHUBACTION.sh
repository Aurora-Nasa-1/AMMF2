#!/bin/bash
LATEST_TAG=$(cat latest_tag.txt)
CURRENT_TIME=$(cat current_time.txt)
. ./module_settings/config.sh
echo "id=${action_id}" >module.prop
echo "name=${action_name}" >>module.prop
echo "version=${LATEST_TAG}" >>module.prop
echo "versionCode=${CURRENT_TIME}" >>module.prop
echo "author=${action_author}" >>module.prop
echo "description=${action_description}" >>module.prop
echo "updateJson=${updateJson}" >>module.prop

mkdir bin
sed -i "s/20240503/${CURRENT_TIME}/g" webroot/pages/status.js
find webroot -name "status.js" -exec sed -i "s/Aurora-Nasa-1\/AMMF/${Github_update_repo}/g" {} \;
find files -name "*.sh" -exec sed -i "s/AMMF/${action_id}/g" {} \;
find webroot -name "*.js" -exec sed -i "s/AMMF/${action_id}/g" {} \;
find src -name "*.cpp" -exec sed -i "s/AMMF2/${action_id}/g" {} \;
sed -i "s/AMMF/${action_id}/g" webroot/index.html
find webroot/translations -name "*.json" -exec sed -i "s/AMMF/${action_name}/g" {} \;
echo "已完成模块ID替换"
# Create META-INF directory structure
mkdir -p META-INF/com/google/android
echo '#MAGISK' >META-INF/com/google/android/updater-script

# Build
export CFLAGS="-O3 -flto"
export CXXFLAGS="-O3 -flto -std=c++20"
# 查找所有cpp文件并构建
for cpp_file in src/*.cpp; do
    filename=$(basename -- "$cpp_file" .cpp)

    # 构建aarch64版本
    $ANDROID_NDK_HOME/toolchains/llvm/prebuilt/linux-x86_64/bin/aarch64-linux-android21-clang++ \
        $CXXFLAGS -Wall -Wextra -static-libstdc++ \
        -I src -I src/ \
        -o "bin/${filename}-${action_id}-aarch64" "$cpp_file"

    # 构建x86_64版本
    $ANDROID_NDK_HOME/toolchains/llvm/prebuilt/linux-x86_64/bin/x86_64-linux-android21-clang++ \
        $CXXFLAGS -Wall -Wextra -static-libstdc++ \
        -I src -I src/ \
        -o "bin/${filename}-${action_id}-x86_64" "$cpp_file"
done
# 自动strip所有生成的二进制文件
for binary in bin/*-aarch64 bin/*-x86_64; do
    $ANDROID_NDK_HOME/toolchains/llvm/prebuilt/linux-x86_64/bin/llvm-strip "$binary" || echo "Failed to strip $binary"
done

rm -rf src
rm build.sh
rm latest_tag.txt
rm current_time.txt
rm build_for_GITHUBACTION.sh
