#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::process::Command;

#[tauri::command]
fn launch_flextesa(
    block_time: usize,
    protocol: String,
    flextesa_port: usize,
    image_id: usize,
    flextesa_box: String,
) -> String {
    match Command::new("docker")
        .arg("run")
        .arg("--rm")
        .arg("--name")
        .arg(format!("{}-sandbox", protocol))
        .arg("--detach")
        .arg("-p")
        .arg(format!("{}:{}", flextesa_port, flextesa_port))
        .arg("--env")
        .arg("flextesa_node_cors_origin=*")
        .arg("--env")
        .arg(format!("block_time={}", block_time))
        .arg(format!("oxheadalpha/flextesa:{}", image_id))
        .arg(flextesa_box.clone())
        .arg("start")
        .arg("--genesis")
        .arg("random")
        .spawn()
    {
        Ok(child) => format!("{:?}", child.id()),
        Err(err) => format!("Flextesa didn't start: {:?}", err),
    }
}

#[tauri::command]
fn kill_flextesa(protocol: String) -> bool {
    match Command::new("docker")
        .arg("kill")
        .arg(format!("{}-sandbox", protocol))
        .spawn()
    {
        Ok(_) => true,
        Err(_) => false,
    }
}

fn main() {
    let context = tauri::generate_context!();
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![launch_flextesa, kill_flextesa])
        .menu(if cfg!(target_os = "macos") {
            tauri::Menu::os_default(&context.package_info().name)
        } else {
            tauri::Menu::default()
        })
        .run(context)
        .expect("error while running tauri application");
}
