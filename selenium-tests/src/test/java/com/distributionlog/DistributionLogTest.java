package com.distributionlog;

import org.junit.jupiter.api.*;
import org.openqa.selenium.*;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Selenium tests for Distribution Log app.
 *
 * Prerequisites:
 *   1. Run the web server: python -m http.server 8080
 *      (from the ClaudeCodeTest repo root)
 *   2. Chrome must be installed. Selenium Manager (bundled with Selenium 4)
 *      downloads chromedriver automatically — no manual setup needed.
 *
 * Run: mvn test   (from the selenium-tests/ directory)
 */
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class DistributionLogTest {

    private static final String BASE_URL = "http://localhost:8080/distribution-log.html";
    private static final String USERNAME  = "admin";
    private static final String PASSWORD  = "1234";

    private static WebDriver driver;
    private static WebDriverWait wait;

    // ── Test data ─────────────────────────────────────────────────────────────
    private static final String DIAPERS   = "10";
    private static final String WIPES     = "5";
    private static final String NUTRITION = "3";
    private static final String ADDRESS   = "123 Test Street, Springfield";

    // ── Setup / Teardown ──────────────────────────────────────────────────────

    @BeforeAll
    static void launchBrowser() {
        ChromeOptions options = new ChromeOptions();
        // Remove --headless to watch the browser; add it back for CI
        // options.addArguments("--headless=new");
        options.addArguments("--window-size=1280,900");

        driver = new ChromeDriver(options);
        wait   = new WebDriverWait(driver, Duration.ofSeconds(10));
    }

    @AfterAll
    static void closeBrowser() {
        if (driver != null) {
            driver.quit();
        }
    }

    // ── Helper methods ────────────────────────────────────────────────────────

    private WebElement waitFor(By locator) {
        return wait.until(ExpectedConditions.visibilityOfElementLocated(locator));
    }

    private WebElement waitClickable(By locator) {
        return wait.until(ExpectedConditions.elementToBeClickable(locator));
    }

    private void login(String user, String pass) {
        driver.get(BASE_URL);
        waitFor(By.id("username")).sendKeys(user);
        driver.findElement(By.id("password")).sendKeys(pass);
        waitClickable(By.id("login-btn")).click();
    }

    // ── Tests ─────────────────────────────────────────────────────────────────

    @Test
    @Order(1)
    @DisplayName("Login fails with wrong credentials")
    void loginFailsWithBadCredentials() {
        driver.get(BASE_URL);
        waitFor(By.id("username")).sendKeys("wronguser");
        driver.findElement(By.id("password")).sendKeys("wrongpass");
        waitClickable(By.id("login-btn")).click();

        WebElement error = waitFor(By.id("login-error"));
        assertFalse(error.getText().isEmpty(), "Error message should be shown");

        // App view must remain hidden
        WebElement appView = driver.findElement(By.id("app-view"));
        assertEquals("none", appView.getCssValue("display"), "App view should stay hidden");
    }

    @Test
    @Order(2)
    @DisplayName("Login succeeds with valid credentials (admin / 1234)")
    void loginSucceeds() {
        login(USERNAME, PASSWORD);

        WebElement appView = waitFor(By.id("app-view"));
        assertTrue(appView.isDisplayed(), "App view should be visible after login");

        // Login panel should be gone
        WebElement loginView = driver.findElement(By.id("login-view"));
        assertEquals("none", loginView.getCssValue("display"), "Login view should be hidden");
    }

    @Test
    @Order(3)
    @DisplayName("Submit fails when address is empty (alert shown)")
    void submitRequiresAddress() {
        // Assumes we are already logged in from previous test
        waitFor(By.id("diapers")).sendKeys(DIAPERS);
        driver.findElement(By.id("wipes")).sendKeys(WIPES);
        driver.findElement(By.id("nutrition")).sendKeys(NUTRITION);
        // Intentionally leave address blank
        waitClickable(By.id("submit-btn")).click();

        // Expect a browser alert
        Alert alert = wait.until(ExpectedConditions.alertIsPresent());
        String alertText = alert.getText();
        assertTrue(alertText.contains("address"), "Alert should mention 'address'");
        alert.accept();

        // Clear filled fields before next test
        driver.findElement(By.id("diapers")).clear();
        driver.findElement(By.id("wipes")).clear();
        driver.findElement(By.id("nutrition")).clear();
    }

    @Test
    @Order(4)
    @DisplayName("Submit record with diapers, wipes, nutrition and address")
    void submitRecord() {
        // Fill form
        waitFor(By.id("diapers")).sendKeys(DIAPERS);
        driver.findElement(By.id("wipes")).sendKeys(WIPES);
        driver.findElement(By.id("nutrition")).sendKeys(NUTRITION);
        driver.findElement(By.id("address")).sendKeys(ADDRESS);

        waitClickable(By.id("submit-btn")).click();

        // Form fields should be cleared after submit
        assertEquals("", driver.findElement(By.id("diapers")).getAttribute("value"),
                "Diapers field should be cleared");
        assertEquals("", driver.findElement(By.id("wipes")).getAttribute("value"),
                "Wipes field should be cleared");
        assertEquals("", driver.findElement(By.id("nutrition")).getAttribute("value"),
                "Nutrition field should be cleared");
        assertEquals("", driver.findElement(By.id("address")).getAttribute("value"),
                "Address field should be cleared");
    }

    @Test
    @Order(5)
    @DisplayName("Submitted record appears in history table")
    void recordAppearsInHistory() {
        // History table should show our record (it's prepended, so it's the first row)
        WebElement tbody = waitFor(By.id("history-body"));
        java.util.List<WebElement> rows = tbody.findElements(By.tagName("tr"));

        assertFalse(rows.isEmpty(), "History should have at least one record");

        // First row (newest) should contain our submitted values
        String rowText = rows.get(0).getText();
        assertTrue(rowText.contains(ADDRESS),   "Row should contain the address");
        assertTrue(rowText.contains(DIAPERS),   "Row should contain diapers count");
        assertTrue(rowText.contains(WIPES),     "Row should contain wipes count");
        assertTrue(rowText.contains(NUTRITION), "Row should contain nutrition count");
    }

    @Test
    @Order(6)
    @DisplayName("Logout returns to login screen")
    void logout() {
        waitClickable(By.id("logout-btn")).click();

        WebElement loginView = waitFor(By.id("login-view"));
        assertTrue(loginView.isDisplayed(), "Login view should reappear after logout");
    }
}
